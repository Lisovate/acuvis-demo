package links

import "time"

// Link is the persisted short-link row.
type Link struct {
	ID           int64      `json:"id"`
	Slug         string     `json:"slug"`
	TargetURL    string     `json:"targetUrl"`
	OwnerID      int64      `json:"-"`
	CreatedAt    time.Time  `json:"createdAt"`
	ExpiresAt    *time.Time `json:"expiresAt,omitempty"`
	PasswordHash string     `json:"-"`
}

// CreateLinkRequest is the JSON body for POST /links.
type CreateLinkRequest struct {
	TargetURL string     `json:"targetUrl"`
	Slug      string     `json:"slug,omitempty"`
	ExpiresAt *time.Time `json:"expiresAt,omitempty"`
	Password  string     `json:"password,omitempty"`
}

// LinkResponse is the JSON envelope returned to clients.
type LinkResponse struct {
	ID                int64      `json:"id"`
	Slug              string     `json:"slug"`
	TargetURL         string     `json:"targetUrl"`
	CreatedAt         time.Time  `json:"createdAt"`
	ExpiresAt         *time.Time `json:"expiresAt,omitempty"`
	PasswordProtected bool       `json:"passwordProtected"`
}
