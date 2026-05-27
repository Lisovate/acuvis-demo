package links

import (
	"crypto/rand"
	"database/sql"
	"errors"
	"fmt"
)

// Service holds link CRUD logic. Constructed once at startup with the
// shared *sql.DB.
type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

const slugAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
const slugLength = 8

// ErrSlugTaken signals a uniqueness collision on slug.
var ErrSlugTaken = errors.New("slug already in use")

// ErrNotFound signals the slug doesn't exist or the caller doesn't own it.
var ErrNotFound = errors.New("link not found")

// Create persists a new link for the supplied owner.
func (s *Service) Create(req CreateLinkRequest, ownerID int64) (*Link, error) {
	slug := req.Slug
	if slug == "" {
		generated, err := generateSlug()
		if err != nil {
			return nil, err
		}
		slug = generated
	}
	res, err := s.db.Exec(
		`INSERT INTO links(slug, target_url, owner_id) VALUES (?, ?, ?)`,
		slug, req.TargetURL, ownerID,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return nil, ErrSlugTaken
		}
		return nil, fmt.Errorf("insert link: %w", err)
	}
	id, _ := res.LastInsertId()
	return s.findByID(id)
}

// FindBySlug looks up a link by its public slug. Used by the redirect
// handler; doesn't filter by owner.
func (s *Service) FindBySlug(slug string) (*Link, error) {
	link, err := s.scanOne(`SELECT id, slug, target_url, owner_id, created_at FROM links WHERE slug = ?`, slug)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return link, err
}

// List returns the caller's links ordered by creation date desc.
func (s *Service) List(ownerID int64) ([]Link, error) {
	rows, err := s.db.Query(
		`SELECT id, slug, target_url, owner_id, created_at FROM links WHERE owner_id = ? ORDER BY created_at DESC`,
		ownerID,
	)
	if err != nil {
		return nil, fmt.Errorf("list links: %w", err)
	}
	defer rows.Close()
	var out []Link
	for rows.Next() {
		var l Link
		if err := rows.Scan(&l.ID, &l.Slug, &l.TargetURL, &l.OwnerID, &l.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, l)
	}
	return out, rows.Err()
}

func (s *Service) findByID(id int64) (*Link, error) {
	return s.scanOne(`SELECT id, slug, target_url, owner_id, created_at FROM links WHERE id = ?`, id)
}

func (s *Service) scanOne(query string, args ...any) (*Link, error) {
	row := s.db.QueryRow(query, args...)
	var l Link
	if err := row.Scan(&l.ID, &l.Slug, &l.TargetURL, &l.OwnerID, &l.CreatedAt); err != nil {
		return nil, err
	}
	return &l, nil
}

func generateSlug() (string, error) {
	bytes := make([]byte, slugLength)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("generate slug: %w", err)
	}
	out := make([]byte, slugLength)
	for i, b := range bytes {
		out[i] = slugAlphabet[int(b)%len(slugAlphabet)]
	}
	return string(out), nil
}

func isUniqueViolation(err error) bool {
	return err != nil && (containsString(err.Error(), "UNIQUE constraint failed") ||
		containsString(err.Error(), "constraint failed: UNIQUE"))
}

func containsString(s, substr string) bool {
	for i := 0; i+len(substr) <= len(s); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
