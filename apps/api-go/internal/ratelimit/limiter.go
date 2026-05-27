// Package ratelimit provides a process-local IP-bucketed sliding window
// to throttle POST /links. Counters are in-memory; production deployments
// should swap this for Redis so multiple workers share state.
package ratelimit

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"
)

// Limit is the number of requests permitted per window per IP.
const Limit = 60

// Window is the sliding-window length.
const Window = time.Minute

// Limiter wraps an HTTP handler and rejects requests beyond the limit.
type Limiter struct {
	counters map[string][]time.Time
}

func New() *Limiter {
	return &Limiter{counters: make(map[string][]time.Time)}
}

// Middleware returns a chi-style middleware. Apply to the route group
// you want rate-limited.
func (l *Limiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := clientIP(r)
		now := time.Now()
		cutoff := now.Add(-Window)

		history := l.counters[ip]
		// Drop timestamps outside the window.
		fresh := history[:0]
		for _, t := range history {
			if t.After(cutoff) {
				fresh = append(fresh, t)
			}
		}
		if len(fresh) >= Limit {
			l.counters[ip] = fresh
			w.Header().Set("Retry-After", "60")
			w.Header().Set("content-type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "rate limit exceeded"})
			return
		}
		l.counters[ip] = append(fresh, now)
		next.ServeHTTP(w, r)
	})
}

func clientIP(r *http.Request) string {
	if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
		if comma := strings.Index(forwarded, ","); comma >= 0 {
			return strings.TrimSpace(forwarded[:comma])
		}
		return strings.TrimSpace(forwarded)
	}
	return r.RemoteAddr
}
