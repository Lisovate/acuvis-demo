package links

import "time"

// Link is the persisted short-link row.
type Link struct {
	ID        int64     `json:"id"`
	Slug      string    `json:"slug"`
	TargetURL string    `json:"targetUrl"`
	OwnerID   int64     `json:"-"`
	CreatedAt time.Time `json:"createdAt"`
}

// CreateLinkRequest is the JSON body for POST /links.
type CreateLinkRequest struct {
	TargetURL string `json:"targetUrl"`
	Slug      string `json:"slug,omitempty"`
}

// LinkResponse is the JSON envelope returned to clients.
type LinkResponse struct {
	ID        int64     `json:"id"`
	Slug      string    `json:"slug"`
	TargetURL string    `json:"targetUrl"`
	CreatedAt time.Time `json:"createdAt"`
}
