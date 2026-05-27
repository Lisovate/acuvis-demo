package analytics

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/Lisovate/acuvis-demo/apps/api-go/internal/auth"
	"github.com/Lisovate/acuvis-demo/apps/api-go/internal/links"
	"github.com/go-chi/chi/v5"
)

const recentClicksLimit = 100

// Handler wires the analytics service to HTTP. Built with the link
// service so we can verify ownership before exposing telemetry.
type Handler struct {
	svc   *Service
	links *links.Service
}

func NewHandler(svc *Service, links *links.Service) *Handler {
	return &Handler{svc: svc, links: links}
}

// HandleLinkAnalytics returns GET /links/{id}/analytics.
func (h *Handler) HandleLinkAnalytics() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := auth.UserFromContext(r.Context())
		if user == nil {
			writeError(w, http.StatusUnauthorized, "not authenticated")
			return
		}
		idStr := chi.URLParam(r, "id")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid link id")
			return
		}
		link, err := h.links.FindByID(id)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) || errors.Is(err, links.ErrNotFound) {
				writeError(w, http.StatusNotFound, "link not found")
				return
			}
			writeError(w, http.StatusInternalServerError, "lookup failed")
			return
		}
		// Same body for "doesn't exist" and "not yours" so we don't leak
		// existence of other tenants' links.
		if link.OwnerID != user.ID {
			writeError(w, http.StatusNotFound, "link not found")
			return
		}
		total, err := h.svc.Count(id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "count failed")
			return
		}
		recent, err := h.svc.Recent(id, recentClicksLimit)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "recent failed")
			return
		}
		var lastClickAt *time.Time
		if len(recent) > 0 {
			t := recent[0].OccurredAt
			lastClickAt = &t
		}
		_ = json.NewEncoder(w).Encode(AnalyticsResponse{
			LinkID:       link.ID,
			Slug:         link.Slug,
			TotalClicks:  total,
			LastClickAt:  lastClickAt,
			RecentClicks: recent,
		})
	}
}

func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("content-type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
