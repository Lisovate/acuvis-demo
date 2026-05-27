package io.acuvis.demo.links;

import java.time.Instant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class LinkDtos {

    public record CreateLinkRequest(
            @NotBlank String targetUrl,
            @Pattern(regexp = "^[a-zA-Z0-9_-]+$") @Size(min = 3, max = 32) String slug,
            /** ISO-8601 expiration cutoff. Null = link never expires. */
            Instant expiresAt,
            /** Optional gate password. Null = publicly redirectable. */
            @Size(min = 4, max = 64) String password) {}

    public record LinkResponse(
            Long id,
            String slug,
            String targetUrl,
            Instant createdAt,
            Instant expiresAt,
            boolean passwordProtected) {}

    private LinkDtos() {}
}
