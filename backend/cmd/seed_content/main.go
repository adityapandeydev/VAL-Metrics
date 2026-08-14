package main

import (
	"database/sql"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type ContentAPIResponse struct {
	Version    string                   `json:"version"`
	Characters []map[string]interface{} `json:"characters"`
	Maps       []map[string]interface{} `json:"maps"`
	Equips     []map[string]interface{} `json:"equips"`
	GameModes  []map[string]interface{} `json:"gameModes"`
}

func main() {
	log.Println("Starting Database Seeder...")

	// Load .env
	_ = godotenv.Load("../../.env")
	_ = godotenv.Load("../.env")
	_ = godotenv.Load(".env")

	dbUrl := os.Getenv("DATABASE_URL")
	apiKey := os.Getenv("RIOT_API_KEY")

	if dbUrl == "" || apiKey == "" {
		log.Fatal("Missing DATABASE_URL or RIOT_API_KEY in .env")
	}

	// Connect to Neon DB
	db, err := sql.Open("postgres", dbUrl)
	if err != nil {
		log.Fatal("Failed to connect to Neon Postgres:", err)
	}
	defer db.Close()

	// 1. Run the Migration Script
	schemaPath := filepath.Join("..", "db", "migrations", "000001_init_schema.up.sql")
	if _, err := os.Stat(schemaPath); os.IsNotExist(err) {
		schemaPath = filepath.Join("db", "migrations", "000001_init_schema.up.sql")
	}
	sqlBytes, err := os.ReadFile(schemaPath)
	if err != nil {
		log.Fatal("Failed to read schema SQL:", err)
	}
	log.Println("Applying 000001_init_schema.up.sql to Neon DB...")
	_, err = db.Exec(string(sqlBytes))
	if err != nil {
		log.Fatal("Failed to execute schema:", err)
	}
	log.Println("Schema applied successfully!")

	// 2. Fetch Riot Content API
	url := "https://ap.api.riotgames.com/val/content/v1/contents"
	log.Println("Fetching Riot Content API...")
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Add("X-Riot-Token", apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Fatal("Failed to fetch Riot API:", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		log.Fatalf("Riot API returned %d: %s", resp.StatusCode, string(body))
	}

	var data ContentAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		log.Fatal("Failed to parse Riot JSON:", err)
	}
	log.Printf("Fetched Version: %s", data.Version)

	// 3. Insert into system_config (Update Version)
	_, err = db.Exec("INSERT INTO system_config (config_key, config_value) VALUES ('riot_content_version', $1) ON CONFLICT (config_key) DO UPDATE SET config_value = $1, updated_at = CURRENT_TIMESTAMP", data.Version)
	if err != nil {
		log.Println("Error updating version:", err)
	}

	// 4. Insert Agents
	agentCount := 0
	for _, char := range data.Characters {
		uuid, _ := char["id"].(string)
		name, _ := char["name"].(string)
		if uuid != "" && name != "" && !strings.Contains(strings.ToLower(name), "null") {
			_, err := db.Exec("INSERT INTO val_agents (uuid, display_name, role, icon_url) VALUES ($1, $2, '', '') ON CONFLICT (uuid) DO UPDATE SET display_name = $2", uuid, name)
			if err == nil {
				agentCount++
			}
		}
	}
	log.Printf("Seeded %d Agents", agentCount)

	// 5. Insert Maps
	mapCount := 0
	for _, m := range data.Maps {
		uuid, _ := m["id"].(string)
		name, _ := m["name"].(string)
		assetPath, _ := m["assetPath"].(string)
		
		internalName := ""
		parts := strings.Split(assetPath, "/")
		if len(parts) > 3 {
			internalName = parts[3]
		}
		
		if uuid != "" && name != "" && !strings.Contains(strings.ToLower(name), "null") {
			_, err := db.Exec("INSERT INTO val_maps (uuid, internal_name, display_name, minimap_url) VALUES ($1, $2, $3, '') ON CONFLICT (uuid) DO UPDATE SET display_name = $3, internal_name = $2", uuid, internalName, name)
			if err == nil {
				mapCount++
			}
		}
	}
	log.Printf("Seeded %d Maps", mapCount)

	// 6. Insert Weapons (Equips)
	wpnCount := 0
	for _, eq := range data.Equips {
		uuid, _ := eq["id"].(string)
		name, _ := eq["name"].(string)
		if uuid != "" && name != "" && !strings.Contains(strings.ToLower(name), "null") {
			_, err := db.Exec("INSERT INTO val_weapons (uuid, display_name, category) VALUES ($1, $2, '') ON CONFLICT (uuid) DO UPDATE SET display_name = $2", uuid, name)
			if err == nil {
				wpnCount++
			}
		}
	}
	log.Printf("Seeded %d Weapons", wpnCount)

	// 7. Insert Modes
	modeCount := 0
	for _, gm := range data.GameModes {
		uuid, _ := gm["id"].(string)
		name, _ := gm["name"].(string)
		if uuid != "" && name != "" && !strings.Contains(strings.ToLower(name), "null") {
			_, err := db.Exec("INSERT INTO val_modes (uuid, display_name) VALUES ($1, $2) ON CONFLICT (uuid) DO UPDATE SET display_name = $2", uuid, name)
			if err == nil {
				modeCount++
			}
		}
	}
	log.Printf("Seeded %d Game Modes", modeCount)

	log.Println("Seeding Complete! Neon Database is ready for production.")
}
