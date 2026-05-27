package io.acuvis.demo.links;

import java.util.List;

import io.acuvis.demo.auth.AuthInterceptor;
import io.acuvis.demo.auth.User;
import io.acuvis.demo.links.LinkDtos.CreateLinkRequest;
import io.acuvis.demo.links.LinkDtos.LinkResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/links")
public class LinkController {

    private final LinkService service;

    public LinkController(LinkService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<LinkResponse> create(@Valid @RequestBody CreateLinkRequest req,
                                                HttpServletRequest request) {
        User user = (User) request.getAttribute(AuthInterceptor.USER_ATTR);
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req, user));
    }

    @GetMapping
    public List<LinkResponse> list(HttpServletRequest request) {
        User user = (User) request.getAttribute(AuthInterceptor.USER_ATTR);
        return service.list(user);
    }
}
