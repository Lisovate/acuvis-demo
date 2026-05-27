package io.acuvis.demo.links;

import java.net.URI;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class RedirectController {

    private final LinkRepository links;

    public RedirectController(LinkRepository links) {
        this.links = links;
    }

    @GetMapping("/{slug}")
    public ResponseEntity<Void> redirect(@PathVariable String slug) {
        Link link = links.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "link not found"));
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(link.getTargetUrl())).build();
    }
}
