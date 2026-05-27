// Package config holds the env-driven runtime configuration. Everything
// reads through a single Config value passed via constructor injection
// rather than reading os.Getenv at the call site.
package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	Addr         string
	DatabaseURL  string
	JWTSecret    string
	JWTTTL       int // seconds
	CORSOrigins  []string
}

// Load reads env vars and returns a populated Config with sensible
// development defaults.
func Load() Config {
	return Config{
		Addr:        envOr("ADDR", ":4000"),
		DatabaseURL: envOr("DATABASE_URL", "data/app.sqlite"),
		JWTSecret:   envOr("JWT_SECRET", "dev-only-not-for-prod"),
		JWTTTL:      envInt("JWT_TTL_SECONDS", 60*60*24*7),
		CORSOrigins: splitCSV(envOr("CORS_ORIGINS", "http://localhost:5173")),
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}

func splitCSV(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}
