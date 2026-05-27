package analytics

import "time"

// Click is one redirect event.
type Click struct {
	ID         int64     `json:"-"`
	LinkID     int64     `json:"-"`
	OccurredAt time.Time `json:"timestamp"`
	IPAddress  string    `json:"ipAddress,omitempty"`
	UserAgent  string    `json:"userAgent,omitempty"`
	Referer    string    `json:"referer,omitempty"`
}

// AnalyticsResponse is the JSON envelope for GET /links/{id}/analytics.
type AnalyticsResponse struct {
	LinkID       int64      `json:"linkId"`
	Slug         string     `json:"slug"`
	TotalClicks  int64      `json:"totalClicks"`
	LastClickAt  *time.Time `json:"lastClickAt"`
	RecentClicks []Click    `json:"recentClicks"`
}
