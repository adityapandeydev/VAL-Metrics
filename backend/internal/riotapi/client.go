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

// RateLimitInterceptor monitors Riot HTTP headers and applies token bucket exponential backoff
type RateLimitInterceptor struct {
	mu           sync.Mutex
	lastRetryAt  time.Time
	minInterval  time.Duration
	lastRequest  time.Time
}

func NewRateLimitInterceptor() *RateLimitInterceptor {
	return &RateLimitInterceptor{
		minInterval: 55 * time.Millisecond, // ~18 requests/sec (safely under standard 20 req/s threshold)
	}
}

func (r *RateLimitInterceptor) Wait(ctx context.Context) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now()
	if now.Before(r.lastRetryAt) {
		sleepDuration := r.lastRetryAt.Sub(now)
		log.Printf("[RIOT-429-DEFENSE] Rate limit backoff active. Stalling outbound request for %v...", sleepDuration)
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
			sec = 5 // Default safe delay on unreadable retry header
		}
		r.lastRetryAt = time.Now().Add(time.Duration(sec)*time.Second + (200 * time.Millisecond))
		log.Printf("[RIOT-429-DEFENSE] HTTP 429 encountered! Setting retry cutoff to %v (%d seconds)", r.lastRetryAt, sec)
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

// GetCluster returns the correct geographical cluster for an active VALORANT shard
func (c *Client) GetCluster(shard string) string {
	if cluster, found := ShardToCluster[shard]; found {
		return cluster
	}
	return "americas" // Global safe fallback
}

// doRequest performs rate-limited HTTP calls with automatic retry injection
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
		return nil, fmt.Errorf("riot api returned status %d for %s: %s", resp.StatusCode, url, string(body))
	}

	return io.ReadAll(resp.Body)
}

// ResolveRiotID queries global Account API to extract PUUID and auto-detect geographical shard
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

	// Proactively look up their active game shard via active-shards endpoint
	shardUrl := fmt.Sprintf("https://%s.api.riotgames.com/riot/account/v1/active-shards/by-game/val/by-puuid/%s", cluster, account.PUUID)
	shardData, err := c.doRequest(ctx, shardUrl)
	activeShard := fallbackShard
	if err == nil {
		var shardResp model.ActiveShardResponse
		if err := json.Unmarshal(shardData, &shardResp); err == nil && shardResp.ActiveShard != "" {
			activeShard = shardResp.ActiveShard
			log.Printf("[GLOBAL-ROUTING] Auto-detected active shard '%s' for PUUID %s", activeShard, account.PUUID)
		}
	}

	return &account, activeShard, nil
}
