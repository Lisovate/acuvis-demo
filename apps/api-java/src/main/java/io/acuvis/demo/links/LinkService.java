package io.acuvis.demo.links;

import java.security.SecureRandom;
import java.util.List;

import io.acuvis.demo.auth.User;
import io.acuvis.demo.links.LinkDtos.CreateLinkRequest;
import io.acuvis.demo.links.LinkDtos.LinkResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LinkService {

    private static final String SLUG_ALPHABET =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final int SLUG_LENGTH = 8;

    private final LinkRepository links;
    private final SecureRandom random = new SecureRandom();

    public LinkService(LinkRepository links) {
        this.links = links;
    }

    public LinkResponse create(CreateLinkRequest req, User owner) {
        String slug = (req.slug() == null || req.slug().isBlank()) ? generateSlug() : req.slug();
        if (links.existsBySlug(slug)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "slug already in use");
        }
        Link link = new Link();
        link.setSlug(slug);
        link.setTargetUrl(req.targetUrl());
        link.setOwner(owner);
        Link saved = links.save(link);
        return toResponse(saved);
    }

    public List<LinkResponse> list(User owner) {
        return links.findByOwnerOrderByCreatedAtDesc(owner).stream().map(this::toResponse).toList();
    }

    private LinkResponse toResponse(Link link) {
        return new LinkResponse(link.getId(), link.getSlug(), link.getTargetUrl(), link.getCreatedAt());
    }

    private String generateSlug() {
        StringBuilder sb = new StringBuilder(SLUG_LENGTH);
        for (int i = 0; i < SLUG_LENGTH; i++) {
            sb.append(SLUG_ALPHABET.charAt(random.nextInt(SLUG_ALPHABET.length())));
        }
        return sb.toString();
    }
}
