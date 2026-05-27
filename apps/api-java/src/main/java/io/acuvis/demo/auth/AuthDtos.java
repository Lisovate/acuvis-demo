package io.acuvis.demo.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    public record RegisterRequest(
            @Email @NotBlank String email,
            @NotBlank @Size(min = 8, max = 128) String password) {}

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password) {}

    public record TokenResponse(String token, Long userId, String email) {}

    private AuthDtos() {}
}
