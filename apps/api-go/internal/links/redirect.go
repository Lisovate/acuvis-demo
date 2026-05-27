package links

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// RedirectHandler issues a 302 to the link's target URL by slug.
func (h *Handler) RedirectHandler(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	link, err := h.svc.FindBySlug(slug)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			writeError(w, http.StatusNotFound, "link not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "lookup failed")
		return
	}
	http.Redirect(w, r, link.TargetURL, http.StatusFound)
}
