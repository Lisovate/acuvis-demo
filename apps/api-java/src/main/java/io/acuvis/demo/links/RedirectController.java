package io.acuvis.demo.links;

import java.net.URI;
import java.time.Instant;

import io.acuvis.demo.analytics.ClickService;
import io.acuvis.demo.auth.LinkPasswordHasher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class RedirectController {

    private final LinkRepository links;
    private final LinkPasswordHasher hasher;
    private final ClickService clicks;

    public RedirectController(LinkRepository links, LinkPasswordHasher hasher, ClickService clicks) {
        this.links = links;
        this.hasher = hasher;
        this.clicks = clicks;
    }

    @GetMapping("/{slug}")
    public ResponseEntity<Void> redirect(
            @PathVariable String slug,
            @RequestParam(value = "password", required = false) String password,
            HttpServletRequest request) {
        Link link = links.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "link not found"));

        // Expiration check. Null = never expires.
        if (link.getExpiresAt() != null && link.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.GONE, "link expired");
        }

        // Password gate.
        if (link.getPasswordHash() != null) {
            if (password == null || password.isBlank()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "password required");
            }
            if (!hasher.verify(password, link.getPasswordHash())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "invalid password");
            }
        }

        // Record the click before issuing the redirect — analytics are
        // eventually-consistent but writing inline keeps the demo simple.
        clicks.record(
                link,
                request.getRemoteAddr(),
                request.getHeader("User-Agent"),
                request.getHeader("Referer"));

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(link.getTargetUrl()))
                .build();
    }
}
