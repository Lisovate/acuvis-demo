package links

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/Lisovate/acuvis-demo/apps/api-go/internal/auth"
)

// Handler wires the Service into chi routes. Constructed in main.
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// CreateLink handles POST /links. Must be mounted under auth middleware.
func (h *Handler) CreateLink(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	var req CreateLinkRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}
	if req.TargetURL == "" {
		writeError(w, http.StatusBadRequest, "targetUrl is required")
		return
	}
	link, err := h.svc.Create(req, user.ID)
	if err != nil {
		if errors.Is(err, ErrSlugTaken) {
			writeError(w, http.StatusConflict, "slug already in use")
			return
		}
		writeError(w, http.StatusInternalServerError, "create failed")
		return
	}
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(toResponse(link))
}

// ListLinks handles GET /links. Must be mounted under auth middleware.
func (h *Handler) ListLinks(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	rows, err := h.svc.List(user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "list failed")
		return
	}
	out := make([]LinkResponse, 0, len(rows))
	for _, l := range rows {
		out = append(out, toResponse(&l))
	}
	_ = json.NewEncoder(w).Encode(out)
}

func toResponse(l *Link) LinkResponse {
	return LinkResponse{
		ID:                l.ID,
		Slug:              l.Slug,
		TargetURL:         l.TargetURL,
		CreatedAt:         l.CreatedAt,
		ExpiresAt:         l.ExpiresAt,
		PasswordProtected: l.HasPassword(),
	}
}

func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("content-type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
