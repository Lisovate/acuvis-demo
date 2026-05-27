package io.acuvis.demo.auth;

import java.util.Optional;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Reads the Authorization header on protected routes, resolves the bearer
 * token to a {@link User}, and stashes the resulting user on the request
 * attribute "user". Controllers retrieve via request.getAttribute("user").
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    public static final String USER_ATTR = "user";

    private final JwtService jwt;
    private final UserRepository users;

    public AuthInterceptor(JwtService jwt, UserRepository users) {
        this.jwt = jwt;
        this.users = users;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.regionMatches(true, 0, "Bearer ", 0, 7)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "missing bearer token");
        }
        String token = header.substring(7).trim();
        Optional<Long> userId = jwt.verify(token);
        if (userId.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid token");
        }
        User user = users.findById(userId.get())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "user not found"));
        request.setAttribute(USER_ATTR, user);
        return true;
    }
}
