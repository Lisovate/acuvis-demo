package io.acuvis.demo.analytics;

import java.time.Instant;
import java.util.List;

public final class AnalyticsDtos {

    public record ClickPoint(
            Instant timestamp,
            String ipAddress,
            String userAgent,
            String referer) {}

    public record AnalyticsResponse(
            Long linkId,
            String slug,
            long totalClicks,
            Instant lastClickAt,
            List<ClickPoint> recentClicks) {}

    private AnalyticsDtos() {}
}
