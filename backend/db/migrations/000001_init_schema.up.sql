CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. MASTER AUTHENTICATION LAYER
-- ==========================================

CREATE TABLE app_users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    otp_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE user_riot_links (
    link_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE,
    puuid VARCHAR(128) NOT NULL,
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- This UNIQUE constraint guarantees that a PUUID can only be claimed by ONE user_id at a time.
    -- If User B tries to claim it, the DB will reject it unless User A unlinks it first.
    CONSTRAINT unique_claimed_puuid UNIQUE (puuid)
);

-- ==========================================
-- 1.5. SYSTEM METADATA & CONFIGURATION
-- ==========================================

CREATE TABLE system_config (
    config_key VARCHAR(100) PRIMARY KEY,
    config_value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- We will insert the default version tracking row immediately
INSERT INTO system_config (config_key, config_value) VALUES ('riot_content_version', 'INITIALIZING');

-- ==========================================
-- 2. TACTICAL CONTENT API (Static Game Assets)
-- ==========================================

CREATE TABLE val_agents (
    uuid VARCHAR(128) PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL,
    role VARCHAR(50),
    icon_url TEXT
);

CREATE TABLE val_maps (
    uuid VARCHAR(128) PRIMARY KEY,
    internal_name VARCHAR(100) NOT NULL, -- e.g. "Juliett"
    display_name VARCHAR(100) NOT NULL,  -- e.g. "Abyss"
    minimap_url TEXT
);

CREATE TABLE val_weapons (
    uuid VARCHAR(128) PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL,
    category VARCHAR(50)
);

CREATE TABLE val_modes (
    uuid VARCHAR(128) PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL
);

-- ==========================================
-- 3. MATCH HISTORY VAULT (High-Volume Telemetry)
-- ==========================================

CREATE TABLE val_players (
    puuid VARCHAR(128) PRIMARY KEY,
    game_name VARCHAR(100) NOT NULL,
    tag_line VARCHAR(50) NOT NULL,
    active_shard VARCHAR(20) NOT NULL, -- 'na', 'eu', 'ap', 'kr'
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE val_matches (
    match_id VARCHAR(128) PRIMARY KEY,
    map_uuid VARCHAR(128) REFERENCES val_maps(uuid),
    game_mode_uuid VARCHAR(128) REFERENCES val_modes(uuid),
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_ms BIGINT NOT NULL,
    server_region VARCHAR(50)
);

CREATE TABLE val_match_participants (
    match_id VARCHAR(128) REFERENCES val_matches(match_id) ON DELETE CASCADE,
    puuid VARCHAR(128) REFERENCES val_players(puuid) ON DELETE CASCADE,
    agent_uuid VARCHAR(128) REFERENCES val_agents(uuid),
    
    team VARCHAR(20) NOT NULL, -- "Red", "Blue"
    rounds_played INT NOT NULL,
    
    -- Core Combat Telemetry
    kills INT NOT NULL DEFAULT 0,
    deaths INT NOT NULL DEFAULT 0,
    assists INT NOT NULL DEFAULT 0,
    combat_score INT NOT NULL DEFAULT 0,
    damage_delta INT NOT NULL DEFAULT 0,
    first_bloods INT NOT NULL DEFAULT 0,
    
    PRIMARY KEY (match_id, puuid)
);

-- Indexes for lightning fast analytics querying
CREATE INDEX idx_match_participants_puuid ON val_match_participants(puuid);
CREATE INDEX idx_matches_date ON val_matches(match_date DESC);
