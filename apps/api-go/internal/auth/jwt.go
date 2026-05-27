package auth

import (
	"fmt"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// JWTIssuer encapsulates the HS256 secret + TTL for session tokens.
// Created once at startup; injected into AuthService and Middleware.
type JWTIssuer struct {
	secret []byte
	ttl    time.Duration
}

func NewJWTIssuer(secret string, ttlSeconds int) *JWTIssuer {
	return &JWTIssuer{
		secret: []byte(secret),
		ttl:    time.Duration(ttlSeconds) * time.Second,
	}
}

// Issue mints a session token carrying the user id as the JWT subject.
func (j *JWTIssuer) Issue(userID int64) (string, error) {
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Subject:   strconv.FormatInt(userID, 10),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(j.ttl)),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(j.secret)
	if err != nil {
		return "", fmt.Errorf("sign jwt: %w", err)
	}
	return signed, nil
}

// Verify parses the token and returns the encoded user id, or an error
// if the signature is invalid or the token is expired.
func (j *JWTIssuer) Verify(token string) (int64, error) {
	parsed, err := jwt.ParseWithClaims(token, &jwt.RegisteredClaims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return j.secret, nil
	})
	if err != nil {
		return 0, err
	}
	claims, ok := parsed.Claims.(*jwt.RegisteredClaims)
	if !ok || !parsed.Valid {
		return 0, fmt.Errorf("invalid claims")
	}
	id, err := strconv.ParseInt(claims.Subject, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("bad subject: %w", err)
	}
	return id, nil
}
