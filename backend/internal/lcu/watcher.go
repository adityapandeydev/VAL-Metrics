package lcu

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type LCUCredentials struct {
	ProcessName string
	ProcessID   string
	Port        string
	Password    string
	Protocol    string
}

// Watcher scans Windows loopback for live VALORANT client lockfiles without memory injection
type Watcher struct {
	creds *LCUCredentials
}

func NewWatcher() *Watcher {
	return &Watcher{}
}

// LocateLockfile checks both Standard Riot Client and live VALORANT install paths
func (w *Watcher) LocateLockfile() (*LCUCredentials, error) {
	localAppData := os.Getenv("LOCALAPPDATA")
	paths := []string{
		filepath.Join(localAppData, "Riot Games", "Riot Client", "Config", "lockfile"),
		"C:\\Riot Games\\VALORANT\\live\\lockfile",
	}

	for _, path := range paths {
		data, err := os.ReadFile(path)
		if err == nil {
			parts := strings.Split(string(data), ":")
			if len(parts) >= 5 {
				w.creds = &LCUCredentials{
					ProcessName: parts[0],
					ProcessID:   parts[1],
					Port:        parts[2],
					Password:    parts[3],
					Protocol:    parts[4],
				}
				log.Printf("[LCU-DISCOVERY] Detected live Riot Client lockfile on HTTPS port %s (PID: %s)", w.creds.Port, w.creds.ProcessID)
				return w.creds, nil
			}
		}
	}
	return nil, fmt.Errorf("VALORANT loopback lockfile not detected (is the game running on this machine?)")
}

// PingLoopback checks LCU HTTPS API health via secure basic auth without triggering Vanguard
func (w *Watcher) PingLoopback() bool {
	creds, err := w.LocateLockfile()
	if err != nil {
		return false
	}

	url := fmt.Sprintf("https://127.0.0.1:%s/help", creds.Port)
	client := &http.Client{
		Timeout: 3 * time.Second,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, // LCU uses self-signed loopback certificates
		},
	}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return false
	}
	req.SetBasicAuth("riot", creds.Password)

	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		return false
	}
	defer resp.Body.Close()

	log.Println("[LCU-SUCCESS] Loopback HTTPS connection established with VALORANT client!")
	return true
}
