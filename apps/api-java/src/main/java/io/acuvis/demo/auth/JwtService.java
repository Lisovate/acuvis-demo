package io.acuvis.demo.auth;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

import javax.crypto.SecretKey;

import io.acuvis.demo.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

/**
 * HS256 issuance + verification. Secret comes from acuvis.jwt.secret.
 * Tokens carry only the user id; the controller looks up the row per
 * request.
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final long ttlSeconds;

    public JwtService(AppProperties props) {
        byte[] bytes = props.jwt().secret().getBytes(StandardCharsets.UTF_8);
        this.key = Keys.hmacShaKeyFor(padToMinKey(bytes));
        this.ttlSeconds = props.jwt().ttlSeconds();
    }

    public String issue(long userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(ttlSeconds)))
                .signWith(key)
                .compact();
    }

    public Optional<Long> verify(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.of(Long.parseLong(claims.getSubject()));
        } catch (JwtException | NumberFormatException e) {
            return Optional.empty();
        }
    }

    /** jjwt requires the HMAC key to be at least 256 bits — pad if the
     *  configured secret is too short for dev convenience. */
    private static byte[] padToMinKey(byte[] bytes) {
        if (bytes.length >= 32) return bytes;
        byte[] padded = new byte[32];
        System.arraycopy(bytes, 0, padded, 0, bytes.length);
        return padded;
    }
}
