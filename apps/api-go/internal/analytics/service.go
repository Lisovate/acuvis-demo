package analytics

import (
	"database/sql"
	"fmt"
)

// Service persists and queries click telemetry.
type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

// Record inserts a click row for a successful redirect. Called inline
// from the redirect handler; production deployments should swap this
// for an async queue so a slow DB doesn't slow the redirect.
func (s *Service) Record(linkID int64, ipAddress, userAgent, referer string) error {
	_, err := s.db.Exec(
		`INSERT INTO clicks(link_id, ip_address, user_agent, referer) VALUES (?, ?, ?, ?)`,
		linkID, ipAddress, userAgent, referer,
	)
	if err != nil {
		return fmt.Errorf("insert click: %w", err)
	}
	return nil
}

// Recent returns up to limit click rows for the link, newest first.
func (s *Service) Recent(linkID int64, limit int) ([]Click, error) {
	rows, err := s.db.Query(
		`SELECT id, link_id, occurred_at, COALESCE(ip_address, ''), COALESCE(user_agent, ''), COALESCE(referer, '') FROM clicks WHERE link_id = ? ORDER BY occurred_at DESC LIMIT ?`,
		linkID, limit,
	)
	if err != nil {
		return nil, fmt.Errorf("recent clicks: %w", err)
	}
	defer rows.Close()
	var out []Click
	for rows.Next() {
		var c Click
		if err := rows.Scan(&c.ID, &c.LinkID, &c.OccurredAt, &c.IPAddress, &c.UserAgent, &c.Referer); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

// Count totals all clicks for a link.
func (s *Service) Count(linkID int64) (int64, error) {
	var n int64
	err := s.db.QueryRow(`SELECT COUNT(*) FROM clicks WHERE link_id = ?`, linkID).Scan(&n)
	return n, err
}
