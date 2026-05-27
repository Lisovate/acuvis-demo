package io.acuvis.demo.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Typed access to the {@code acuvis.*} block in application.yml.
 */
@ConfigurationProperties(prefix = "acuvis")
public record AppProperties(Jwt jwt, Cors cors) {

    public record Jwt(String secret, long ttlSeconds) {}

    public record Cors(List<String> origins) {}
}
