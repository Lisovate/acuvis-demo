package auth

import (
	"database/sql"
	"errors"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// Service holds register/login business logic. Built over *sql.DB so we
// don't need a separate repository abstraction at this scale.
type Service struct {
	db  *sql.DB
	jwt *JWTIssuer
}

func NewService(db *sql.DB, jwt *JWTIssuer) *Service {
	return &Service{db: db, jwt: jwt}
}

// ErrEmailTaken signals the caller tried to register an existing email.
var ErrEmailTaken = errors.New("email already registered")

// ErrInvalidCredentials means login failed (wrong password or no user).
var ErrInvalidCredentials = errors.New("invalid credentials")

// Register hashes the supplied password and inserts a new user, returning
// the freshly minted session token.
func (s *Service) Register(email, password string) (*TokenResponse, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return nil, fmt.Errorf("bcrypt: %w", err)
	}
	res, err := s.db.Exec(`INSERT INTO users(email, password_hash) VALUES (?, ?)`, email, string(hash))
	if err != nil {
		// SQLite unique-constraint violation surfaces here.
		if isUniqueViolation(err) {
			return nil, ErrEmailTaken
		}
		return nil, fmt.Errorf("insert user: %w", err)
	}
	id, _ := res.LastInsertId()
	token, err := s.jwt.Issue(id)
	if err != nil {
		return nil, err
	}
	return &TokenResponse{Token: token, UserID: id, Email: email}, nil
}

// Login verifies the credentials and returns a session token.
func (s *Service) Login(email, password string) (*TokenResponse, error) {
	var id int64
	var storedHash string
	row := s.db.QueryRow(`SELECT id, password_hash FROM users WHERE email = ?`, email)
	if err := row.Scan(&id, &storedHash); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrInvalidCredentials
		}
		return nil, fmt.Errorf("lookup user: %w", err)
	}
	if err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}
	token, err := s.jwt.Issue(id)
	if err != nil {
		return nil, err
	}
	return &TokenResponse{Token: token, UserID: id, Email: email}, nil
}

// FindByID is used by the auth middleware to resolve the request-scoped
// user from the JWT's subject claim.
func (s *Service) FindByID(id int64) (*User, error) {
	var u User
	row := s.db.QueryRow(`SELECT id, email, password_hash, created_at FROM users WHERE id = ?`, id)
	if err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.CreatedAt); err != nil {
		return nil, err
	}
	return &u, nil
}

func isUniqueViolation(err error) bool {
	// sqlite3 driver wraps the error string; keep the dependency-free check
	// rather than reaching for a typed assertion against the driver.
	return err != nil && containsAny(err.Error(), "UNIQUE constraint failed", "constraint failed: UNIQUE")
}

func containsAny(s string, needles ...string) bool {
	for _, n := range needles {
		if len(n) > 0 && indexOf(s, n) >= 0 {
			return true
		}
	}
	return false
}

func indexOf(s, substr string) int {
	// Avoid pulling in strings for one call — keep this file self-contained.
	for i := 0; i+len(substr) <= len(s); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}
