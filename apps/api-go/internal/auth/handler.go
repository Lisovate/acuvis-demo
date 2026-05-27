package auth

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
)

// Handler wires Service to chi routes. Construct one per HTTP server.
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// HandleRegister returns the POST /auth/register handler.
func (h *Handler) HandleRegister() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req RegisterRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid json")
			return
		}
		if !validEmail(req.Email) || len(req.Password) < 8 {
			writeError(w, http.StatusBadRequest, "email/password invalid")
			return
		}
		resp, err := h.svc.Register(req.Email, req.Password)
		if err != nil {
			if errors.Is(err, ErrEmailTaken) {
				writeError(w, http.StatusConflict, "email already registered")
				return
			}
			writeError(w, http.StatusInternalServerError, "register failed")
			return
		}
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(resp)
	}
}

// HandleLogin returns the POST /auth/login handler.
func (h *Handler) HandleLogin() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid json")
			return
		}
		resp, err := h.svc.Login(req.Email, req.Password)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "invalid credentials")
			return
		}
		_ = json.NewEncoder(w).Encode(resp)
	}
}

// writeError emits a JSON error body.
func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("content-type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

func validEmail(s string) bool {
	// Just enough to catch obvious mistakes. Production should use
	// net/mail.ParseAddress.
	return strings.Contains(s, "@") && len(s) >= 3 && len(s) <= 255
}
