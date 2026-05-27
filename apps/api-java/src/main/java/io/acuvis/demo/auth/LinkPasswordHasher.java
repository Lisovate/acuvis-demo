package io.acuvis.demo.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import org.springframework.stereotype.Component;

/**
 * Hashes the gate password attached to a link.
 *
 * <p>Lighter-weight than the user-password BCrypt encoder — link passwords
 * protect short-lived URLs and we don't want a BCrypt round on every
 * redirect.
 */
@Component
public class LinkPasswordHasher {

    public String hash(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(password.getBytes(StandardCharsets.UTF_8));
            return toHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable on this JRE", e);
        }
    }

    public boolean verify(String password, String storedHash) {
        return hash(password).equals(storedHash);
    }

    private static String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
