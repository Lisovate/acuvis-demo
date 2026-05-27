package links

import (
	"errors"
	"net/http"

	"github.com/Lisovate/acuvis-demo/apps/api-go/internal/analytics"
	"github.com/Lisovate/acuvis-demo/apps/api-go/internal/passwords"
	"github.com/go-chi/chi/v5"
)

// RedirectHandler returns a handler that does the slug → target redirect,
// enforcing expiration and password gates, and recording a click before
// the 302. Clicks are written inline; production should swap this for an
// async queue.
func RedirectHandler(linkSvc *Service, clickSvc *analytics.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		slug := chi.URLParam(r, "slug")
		link, err := linkSvc.FindBySlug(slug)
		if err != nil {
			if errors.Is(err, ErrNotFound) {
				writeError(w, http.StatusNotFound, "link not found")
				return
			}
			writeError(w, http.StatusInternalServerError, "lookup failed")
			return
		}

		// Expiration check. Null expires_at → never expires.
		if link.Expired() {
			writeError(w, http.StatusGone, "link expired")
			return
		}

		// Password gate.
		if link.HasPassword() {
			supplied := r.URL.Query().Get("password")
			if supplied == "" {
				writeError(w, http.StatusUnauthorized, "password required")
				return
			}
			if !passwords.Verify(supplied, link.PasswordHash) {
				writeError(w, http.StatusForbidden, "invalid password")
				return
			}
		}

		// Record the click before issuing the redirect — analytics are
		// eventually-consistent but writing inline keeps the demo simple.
		_ = clickSvc.Record(link.ID, r.RemoteAddr, r.Header.Get("User-Agent"), r.Header.Get("Referer"))

		http.Redirect(w, r, link.TargetURL, http.StatusFound)
	}
}
