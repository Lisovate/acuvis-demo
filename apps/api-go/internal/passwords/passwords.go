// Package passwords hashes link gate passwords for short-link protection.
//
// Lighter-weight than user passwords (which use bcrypt) — link passwords
// typically protect short-lived URLs and we don't want a bcrypt round
// per redirect.
package passwords

import (
	"crypto/sha256"
	"encoding/hex"
)

// Hash returns a hex-encoded SHA-256 digest of the password.
func Hash(password string) string {
	sum := sha256.Sum256([]byte(password))
	return hex.EncodeToString(sum[:])
}

// Verify checks a candidate against the stored hash.
func Verify(password, storedHash string) bool {
	return Hash(password) == storedHash
}
