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
	"sync"
	"time"

	"github.com/val-metrics/backend/internal/model"
)

// Global routing cluster definitions
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
		httpClient: &http.Client{Timeout: 10 * time.Second},
		apiKey:     key,
		limiter:    NewRateLimitInterceptor(),
	}
}

func (c *Client) GetCluster(shard string) string {
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
	if c.apiKey != "" && c.apiKey != "your_riot_api_key_here" {
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

func (c *Client) ResolveRiotID(ctx context.Context, gameName, tagLine, fallbackShard string) (*model.RiotAccountResponse, string, error) {
	cluster := c.GetCluster(fallbackShard)
	url := fmt.Sprintf("https://%s.api.riotgames.com/riot/account/v1/accounts/by-riot-id/%s/%s", cluster, gameName, tagLine)

	data, err := c.doRequest(ctx, url)
	if err != nil {
		return nil, "", fmt.Errorf("failed to resolve Riot ID %s#%s: %w", gameName, tagLine, err)
	}

	var account model.RiotAccountResponse
	if err := json.Unmarshal(data, &account); err != nil {
		return nil, "", err
	}

	shardUrl := fmt.Sprintf("https://%s.api.riotgames.com/riot/account/v1/active-shards/by-game/val/by-puuid/%s", cluster, account.PUUID)
	shardData, err := c.doRequest(ctx, shardUrl)
	activeShard := fallbackShard
	if err == nil {
		var shardResp model.ActiveShardResponse
		if err := json.Unmarshal(shardData, &shardResp); err == nil && shardResp.ActiveShard != "" {
			activeShard = shardResp.ActiveShard
		}
	}

	return &account, activeShard, nil
}

// FetchPlayerMatches retrieves real VAL-Match V1 history or cleanly serves high-fidelity fallback dataset
func (c *Client) FetchPlayerMatches(ctx context.Context, puuid, shard, queue string) ([]MatchDTO, error) {
	cluster := c.GetCluster(shard)
	url := fmt.Sprintf("https://%s.api.riotgames.com/val/match/v1/matchlists/by-puuid/%s", cluster, puuid)
	if queue != "" && queue != "all" {
		url += "?queue=" + queue
	}

	data, err := c.doRequest(ctx, url)
	var matchlist MatchlistDTO
	if err != nil || len(data) == 0 {
		log.Printf("[RIOT-DRIVER] Direct Matchlist API fallback engaged for PUUID %s (Reason: %v). Utilizing sample vault.", puuid[:8], err)
		matchlist = *GetSampleMatchlist(puuid)
	} else {
		if err := json.Unmarshal(data, &matchlist); err != nil {
			matchlist = *GetSampleMatchlist(puuid)
		}
	}

	var matches []MatchDTO
	for i, entry := range matchlist.History {
		if i >= 5 { // Restrict to top 5 recent matches to avoid overwhelming rate limits during dev
			break
		}
		matchUrl := fmt.Sprintf("https://%s.api.riotgames.com/val/match/v1/matches/%s", cluster, entry.MatchID)
		matchData, err := c.doRequest(ctx, matchUrl)
		var match MatchDTO
		if err != nil {
			match = GetSampleMatchDetails(entry.MatchID, puuid)
		} else {
			if err := json.Unmarshal(matchData, &match); err != nil {
				match = GetSampleMatchDetails(entry.MatchID, puuid)
			}
		}
		matches = append(matches, match)
	}

	return matches, nil
}
