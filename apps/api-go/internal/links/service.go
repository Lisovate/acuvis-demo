package links

import (
	"crypto/rand"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/Lisovate/acuvis-demo/apps/api-go/internal/passwords"
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
	var passwordHash sql.NullString
	if req.Password != "" {
		passwordHash = sql.NullString{String: passwords.Hash(req.Password), Valid: true}
	}
	var expiresAt sql.NullTime
	if req.ExpiresAt != nil {
		expiresAt = sql.NullTime{Time: *req.ExpiresAt, Valid: true}
	}
	res, err := s.db.Exec(
		`INSERT INTO links(slug, target_url, owner_id, expires_at, password_hash) VALUES (?, ?, ?, ?, ?)`,
		slug, req.TargetURL, ownerID, expiresAt, passwordHash,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return nil, ErrSlugTaken
		}
		return nil, fmt.Errorf("insert link: %w", err)
	}
	id, _ := res.LastInsertId()
	return s.FindByID(id)
}

// FindBySlug looks up a link by its public slug. Used by the redirect
// handler; doesn't filter by owner.
func (s *Service) FindBySlug(slug string) (*Link, error) {
	link, err := s.scanOne(`SELECT id, slug, target_url, owner_id, created_at, expires_at, password_hash FROM links WHERE slug = ?`, slug)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return link, err
}

// FindByID is used by ownership checks (e.g. in the analytics handler).
func (s *Service) FindByID(id int64) (*Link, error) {
	link, err := s.scanOne(`SELECT id, slug, target_url, owner_id, created_at, expires_at, password_hash FROM links WHERE id = ?`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return link, err
}

// List returns the caller's links ordered by creation date desc.
func (s *Service) List(ownerID int64) ([]Link, error) {
	rows, err := s.db.Query(
		`SELECT id, slug, target_url, owner_id, created_at, expires_at, password_hash FROM links WHERE owner_id = ? ORDER BY created_at DESC`,
		ownerID,
	)
	if err != nil {
		return nil, fmt.Errorf("list links: %w", err)
	}
	defer rows.Close()
	var out []Link
	for rows.Next() {
		l, err := scanRow(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *l)
	}
	return out, rows.Err()
}

// Expired returns true if the link has a non-nil ExpiresAt that has passed.
func (l *Link) Expired() bool {
	return l.ExpiresAt != nil && l.ExpiresAt.Before(time.Now())
}

// HasPassword returns true if the link has a non-empty stored hash.
func (l *Link) HasPassword() bool {
	return l.PasswordHash != ""
}

func (s *Service) scanOne(query string, args ...any) (*Link, error) {
	row := s.db.QueryRow(query, args...)
	return scanRow(row)
}

type scannable interface {
	Scan(...any) error
}

func scanRow(row scannable) (*Link, error) {
	var l Link
	var expiresAt sql.NullTime
	var passwordHash sql.NullString
	if err := row.Scan(&l.ID, &l.Slug, &l.TargetURL, &l.OwnerID, &l.CreatedAt, &expiresAt, &passwordHash); err != nil {
		return nil, err
	}
	if expiresAt.Valid {
		t := expiresAt.Time
		l.ExpiresAt = &t
	}
	if passwordHash.Valid {
		l.PasswordHash = passwordHash.String
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
