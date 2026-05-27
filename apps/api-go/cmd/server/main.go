// Package main is the HTTP entry point. Wires config + db + chi router
// and starts the server. Constructor injection throughout; no global
// state besides the *sql.DB handle (closed on shutdown).
package main

import (
	"log"
	"net/http"
	"time"

	"github.com/Lisovate/acuvis-demo/apps/api-go/internal/analytics"
	"github.com/Lisovate/acuvis-demo/apps/api-go/internal/auth"
	"github.com/Lisovate/acuvis-demo/apps/api-go/internal/config"
	"github.com/Lisovate/acuvis-demo/apps/api-go/internal/db"
	"github.com/Lisovate/acuvis-demo/apps/api-go/internal/links"
	"github.com/Lisovate/acuvis-demo/apps/api-go/internal/ratelimit"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	cfg := config.Load()

	conn, err := db.Open(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db open: %v", err)
	}
	defer conn.Close()

	jwt := auth.NewJWTIssuer(cfg.JWTSecret, cfg.JWTTTL)
	authSvc := auth.NewService(conn, jwt)
	linkSvc := links.NewService(conn)
	clickSvc := analytics.NewService(conn)

	authH := auth.NewHandler(authSvc)
	linkH := links.NewHandler(linkSvc)
	analyticsH := analytics.NewHandler(clickSvc, linkSvc)
	limiter := ratelimit.New()

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.CORSOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	}))

	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("content-type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	r.Route("/auth", func(r chi.Router) {
		r.Post("/register", authH.HandleRegister())
		r.Post("/login", authH.HandleLogin())
	})

	r.Route("/links", func(r chi.Router) {
		r.Use(auth.Middleware(authSvc, jwt))
		// Rate-limit just the create endpoint — list is read-only and
		// the redirect is exposed at /{slug} below (no auth, no limit).
		r.With(limiter.Middleware).Post("/", linkH.CreateLink)
		r.Get("/", linkH.ListLinks)
		r.Get("/{id}/analytics", analyticsH.HandleLinkAnalytics())
	})

	// Bare /{slug} for redirects. Mounted AFTER /links so chi's tree
	// resolves the more-specific routes first.
	r.Get("/{slug}", links.RedirectHandler(linkSvc, clickSvc))

	log.Printf("acuvis-demo-api listening on %s", cfg.Addr)
	if err := http.ListenAndServe(cfg.Addr, r); err != nil {
		log.Fatalf("server: %v", err)
	}
}
