package auth

import (
	"context"
	"net/http"
	"strings"
)

// contextKey is unexported so other packages can't collide with our
// request-scoped values.
type contextKey int

const userKey contextKey = 1

// UserFromContext extracts the *User attached by Middleware. Handlers
// that mount under the bearer-token middleware can rely on this being
// non-nil.
func UserFromContext(ctx context.Context) *User {
	v, _ := ctx.Value(userKey).(*User)
	return v
}

// Middleware verifies the Authorization header and injects the resolved
// User into the request context. Routes mounted under it are protected.
func Middleware(svc *Service, jwt *JWTIssuer) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if header == "" || !strings.HasPrefix(strings.ToLower(header), "bearer ") {
				writeError(w, http.StatusUnauthorized, "missing bearer token")
				return
			}
			token := strings.TrimSpace(header[7:])
			id, err := jwt.Verify(token)
			if err != nil {
				writeError(w, http.StatusUnauthorized, "invalid token")
				return
			}
			user, err := svc.FindByID(id)
			if err != nil {
				writeError(w, http.StatusUnauthorized, "user not found")
				return
			}
			ctx := context.WithValue(r.Context(), userKey, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
