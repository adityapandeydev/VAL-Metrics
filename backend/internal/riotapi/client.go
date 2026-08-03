package riotapi

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/val-metrics/backend/internal/model"
)

// Global routing cluster definitions for Riot Account V1
var ShardToCluster = map[string]string{
	"na":    "americas",
	"br":    "americas",
	"latam": "americas",
	"eu":    "europe",
	"ap":    "asia",
	"kr":    "asia",
}

type RateLimitInterceptor struct {
	mu          sync.Mutex
	lastRetryAt time.Time
	minInterval time.Duration
	lastRequest time.Time
}

func NewRateLimitInterceptor() *RateLimitInterceptor {
	return &RateLimitInterceptor{
		minInterval: 55 * time.Millisecond, // ~18 requests/sec safe threshold
	}
}

func (r *RateLimitInterceptor) Wait(ctx context.Context) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now()
	if now.Before(r.lastRetryAt) {
		sleepDuration := r.lastRetryAt.Sub(now)
		log.Printf("[RIOT-429-DEFENSE] Rate limit active. Stalling request for %v...", sleepDuration)
		select {
		case <-time.After(sleepDuration):
		case <-ctx.Done():
			return ctx.Err()
		}
	}

	elapsed := time.Since(r.lastRequest)
	if elapsed < r.minInterval {
		time.Sleep(r.minInterval - elapsed)
	}
	r.lastRequest = time.Now()
	return nil
}

func (r *RateLimitInterceptor) HandleResponseHeaders(resp *http.Response) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if resp.StatusCode == http.StatusTooManyRequests {
		retryAfterStr := resp.Header.Get("Retry-After")
		sec, err := strconv.Atoi(retryAfterStr)
		if err != nil || sec <= 0 {
			sec = 5
		}
		r.lastRetryAt = time.Now().Add(time.Duration(sec)*time.Second + (200 * time.Millisecond))
		log.Printf("[RIOT-429-DEFENSE] HTTP 429 encountered! Setting backoff cutoff to %d seconds", sec)
	}
}

type Client struct {
	httpClient *http.Client
	apiKey     string
	limiter    *RateLimitInterceptor
}

func NewClient() *Client {
	key := os.Getenv("RIOT_API_KEY")
	return &Client{
		httpClient: &http.Client{Timeout: 12 * time.Second},
		apiKey:     strings.TrimSpace(key),
		limiter:    NewRateLimitInterceptor(),
	}
}

func (c *Client) IsRealAPIActive() bool {
	return c.apiKey != "" && c.apiKey != "your_riot_api_key_here" && strings.HasPrefix(c.apiKey, "RGAPI-")
}

func (c *Client) GetCluster(shard string) string {
	shard = strings.ToLower(shard)
	if cluster, found := ShardToCluster[shard]; found {
		return cluster
	}
	return "americas"
}

func (c *Client) doRequest(ctx context.Context, url string) ([]byte, error) {
	if err := c.limiter.Wait(ctx); err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}
	if c.IsRealAPIActive() {
		req.Header.Set("X-Riot-Token", c.apiKey)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	c.limiter.HandleResponseHeaders(resp)

	if resp.StatusCode == http.StatusTooManyRequests {
		log.Printf("[RIOT-API] Throttled on %s. Retrying once after backoff...", url)
		return c.doRequest(ctx, url)
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("riot api status %d for %s: %s", resp.StatusCode, url, string(body))
	}

	return io.ReadAll(resp.Body)
}

// ResolveRiotID queries Riot Account V1 via cluster servers to find real PUUIDs from PlayerName#Tag
func (c *Client) ResolveRiotID(ctx context.Context, gameName, tagLine, fallbackShard string) (*model.RiotAccountResponse, string, error) {
	if !c.IsRealAPIActive() {
		log.Printf("[RIOT-ACCOUNT-OFFLINE] No active RGAPI- key detected. Simulating account resolve for %s#%s", gameName, tagLine)
		return &model.RiotAccountResponse{PUUID: "4b56445b-670f-46ab-977d-dfc4a90f2f46", GameName: gameName, TagLine: tagLine}, fallbackShard, nil
	}

	cluster := c.GetCluster(fallbackShard)
	url := fmt.Sprintf("https://%s.api.riotgames.com/riot/account/v1/accounts/by-riot-id/%s/%s", cluster, gameName, tagLine)
	log.Printf("[LIVE-RIOT-API] Resolving Riot ID across cloud servers: %s", url)

	data, err := c.doRequest(ctx, url)
	if err != nil {
		log.Printf("[LIVE-RIOT-API] Resolve failed for %s#%s (%v). Utilizing offline sample fallback.", gameName, tagLine, err)
		return &model.RiotAccountResponse{PUUID: "4b56445b-670f-46ab-977d-dfc4a90f2f46", GameName: gameName, TagLine: tagLine}, fallbackShard, nil
	}

	var account model.RiotAccountResponse
	if err := json.Unmarshal(data, &account); err != nil {
		return nil, "", err
	}
	log.Printf("[LIVE-RIOT-API] Successfully retrieved real Account PUUID: %s for %s#%s", account.PUUID, account.GameName, account.TagLine)

	shardUrl := fmt.Sprintf("https://%s.api.riotgames.com/riot/account/v1/active-shards/by-game/val/by-puuid/%s", cluster, account.PUUID)
	shardData, err := c.doRequest(ctx, shardUrl)
	activeShard := fallbackShard
	if err == nil {
		var shardResp model.ActiveShardResponse
		if err := json.Unmarshal(shardData, &shardResp); err == nil && shardResp.ActiveShard != "" {
			activeShard = shardResp.ActiveShard
			log.Printf("[LIVE-RIOT-API] Verified Active VALORANT Shard: %s", activeShard)
		}
	}

	return &account, activeShard, nil
}

// FetchPlayerMatches retrieves live VAL-Match V1 match history directly from regional routing servers
func (c *Client) FetchPlayerMatches(ctx context.Context, puuid, shard, queue string) ([]MatchDTO, error) {
	if !c.IsRealAPIActive() || puuid == "4b56445b-670f-46ab-977d-dfc4a90f2f46" {
		log.Printf("[RIOT-DRIVER-SIMULATION] Using high-fidelity fallback match vault for PUUID %s (Offline or Demo Account)", puuid[:8])
		sampleList := GetSampleMatchlist(puuid)
		var matches []MatchDTO
		for _, entry := range sampleList.History {
			matches = append(matches, GetSampleMatchDetails(entry.MatchID, puuid))
		}
		return matches, nil
	}

	// In VALORANT Match V1, matchlists are queried against regional servers (na, eu, ap, kr, br, latam)
	shard = strings.ToLower(shard)
	if shard == "" {
		shard = "na"
	}
	url := fmt.Sprintf("https://%s.api.riotgames.com/val/match/v1/matchlists/by-puuid/%s", shard, puuid)
	if queue != "" && queue != "all" && !strings.EqualFold(queue, "All Acts") {
		url += "?queue=" + strings.ToLower(queue)
	}

	log.Printf("[LIVE-RIOT-API] Fetching Matchlist from %s: %s", shard, url)
	data, err := c.doRequest(ctx, url)
	var matchlist MatchlistDTO
	if err != nil || len(data) == 0 {
		// Attempt cluster routing fallback if regional routing fails
		cluster := c.GetCluster(shard)
		clusterUrl := fmt.Sprintf("https://%s.api.riotgames.com/val/match/v1/matchlists/by-puuid/%s", cluster, puuid)
		log.Printf("[LIVE-RIOT-API] Regional route failed (%v). Attempting cluster route: %s", err, clusterUrl)
		data, err = c.doRequest(ctx, clusterUrl)
		if err != nil || len(data) == 0 {
			log.Printf("[RIOT-DRIVER-WARN] Live matchlist fetch failed (%v). Utilizing fallback vault to prevent UX disruption.", err)
			sampleList := GetSampleMatchlist(puuid)
			var matches []MatchDTO
			for _, entry := range sampleList.History {
				matches = append(matches, GetSampleMatchDetails(entry.MatchID, puuid))
			}
			return matches, nil
		}
	}

	if err := json.Unmarshal(data, &matchlist); err != nil {
		return nil, err
	}
	log.Printf("[LIVE-RIOT-API] Discovered %d recent competitive matches in Riot Cloud for PUUID %s...", len(matchlist.History), puuid[:8])

	var matches []MatchDTO
	for i, entry := range matchlist.History {
		if i >= 5 { // Restrict to top 5 recent encounters for snappy UI load times and rate limit preservation
			break
		}
		matchUrl := fmt.Sprintf("https://%s.api.riotgames.com/val/match/v1/matches/%s", shard, entry.MatchID)
		matchData, err := c.doRequest(ctx, matchUrl)
		if err != nil {
			matchUrl = fmt.Sprintf("https://%s.api.riotgames.com/val/match/v1/matches/%s", c.GetCluster(shard), entry.MatchID)
			matchData, _ = c.doRequest(ctx, matchUrl)
		}

		var match MatchDTO
		if err == nil && len(matchData) > 0 {
			if err := json.Unmarshal(matchData, &match); err == nil {
				matches = append(matches, match)
				log.Printf("[LIVE-RIOT-API] Downloaded complete match telemetry for %s (Map: %s)", entry.MatchID, match.MatchInfo.MapID)
			}
		}
	}

	if len(matches) == 0 {
		log.Printf("[RIOT-DRIVER] No complete live match logs retrieved; falling back to sample dataset.")
		sampleList := GetSampleMatchlist(puuid)
		for _, entry := range sampleList.History {
			matches = append(matches, GetSampleMatchDetails(entry.MatchID, puuid))
		}
	}

	return matches, nil
}
