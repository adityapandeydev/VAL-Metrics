package database

import (
	"time"

	"github.com/val-metrics/backend/internal/model"
	"github.com/val-metrics/backend/internal/riotapi"
)

// Engine defines the high-speed universal database contract for VAL-Metrics.
// Designed for seamless polymorphism between ultra-fast persistent embedded storage (0.1ms reads)
// and multi-node scalable cloud PostgreSQL installations.
type Engine interface {
	// User Account Credentials & Membership
	SaveUser(u *model.User) error
	GetUserByUsername(username string) (*model.User, error)
	GetUserByID(id string) (*model.User, error)
	LinkRiotAccountToUser(userID, puuid string) error

	// Universal Global Riot Account Repository (Zero region toggles required on frontend)
	SaveRiotAccount(acc *model.RiotLinkedAccount) error
	GetRiotAccountByRiotID(gameName, tagLine string) (*model.RiotLinkedAccount, error)
	GetRiotAccountByPUUID(puuid string) (*model.RiotLinkedAccount, error)
	SearchRiotAccounts(prefix string, limit int) ([]*model.RiotLinkedAccount, error)
	ListAccountsForAutoSync(maxStaleAge time.Duration) ([]*model.RiotLinkedAccount, error)

	// Immutable Match Telemetry Archive
	SaveMatch(puuid string, match *riotapi.MatchDTO) error
	GetPlayerMatches(puuid, queue string, limit int) ([]riotapi.MatchDTO, error)
	CountPlayerMatches(puuid string) int

	// Maintenance & Flush
	Close() error
}
