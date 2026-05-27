package io.acuvis.demo.middleware;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Sliding-window rate limit, applied to {@code POST /links}.
 *
 * <p>Counters live process-locally; production should swap this for Redis
 * with TTL keys so multiple workers share the same window.
 */
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    public static final int LIMIT_PER_WINDOW = 60;
    public static final long WINDOW_MS = 60_000L;

    private final Map<String, Deque<Long>> counters = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!isProtected(request)) {
            return true;
        }
        String key = clientIp(request);
        Deque<Long> history = counters.computeIfAbsent(key, k -> new ArrayDeque<>());
        long now = System.currentTimeMillis();
        long cutoff = now - WINDOW_MS;
        while (!history.isEmpty() && history.peekFirst() < cutoff) {
            history.pollFirst();
        }
        if (history.size() >= LIMIT_PER_WINDOW) {
            response.setHeader("Retry-After", String.valueOf(WINDOW_MS / 1000));
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "rate limit exceeded");
        }
        history.addLast(now);
        return true;
    }

    private boolean isProtected(HttpServletRequest request) {
        return "POST".equalsIgnoreCase(request.getMethod()) && "/links".equals(request.getRequestURI());
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            int comma = forwarded.indexOf(',');
            return (comma < 0 ? forwarded : forwarded.substring(0, comma)).trim();
        }
        return request.getRemoteAddr();
    }
}
