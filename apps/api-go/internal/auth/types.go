package auth

import "time"

// User is the persisted account row.
type User struct {
	ID           int64     `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"createdAt"`
}

// RegisterRequest is the JSON body for POST /auth/register.
type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginRequest is the JSON body for POST /auth/login.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// TokenResponse is what the auth endpoints emit on success.
type TokenResponse struct {
	Token  string `json:"token"`
	UserID int64  `json:"userId"`
	Email  string `json:"email"`
}
