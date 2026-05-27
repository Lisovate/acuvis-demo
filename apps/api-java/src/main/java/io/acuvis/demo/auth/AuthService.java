package io.acuvis.demo.auth;

import io.acuvis.demo.auth.AuthDtos.LoginRequest;
import io.acuvis.demo.auth.AuthDtos.RegisterRequest;
import io.acuvis.demo.auth.AuthDtos.TokenResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    public TokenResponse register(RegisterRequest req) {
        if (users.existsByEmail(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "email already registered");
        }
        User user = new User();
        user.setEmail(req.email());
        user.setPasswordHash(encoder.encode(req.password()));
        User saved = users.save(user);
        return new TokenResponse(jwt.issue(saved.getId()), saved.getId(), saved.getEmail());
    }

    public TokenResponse login(LoginRequest req) {
        User user = users.findByEmail(req.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid credentials"));
        if (!encoder.matches(req.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid credentials");
        }
        return new TokenResponse(jwt.issue(user.getId()), user.getId(), user.getEmail());
    }
}
