package io.acuvis.demo.analytics;

import java.util.List;

import io.acuvis.demo.analytics.AnalyticsDtos.AnalyticsResponse;
import io.acuvis.demo.analytics.AnalyticsDtos.ClickPoint;
import io.acuvis.demo.auth.AuthInterceptor;
import io.acuvis.demo.auth.User;
import io.acuvis.demo.links.Link;
import io.acuvis.demo.links.LinkRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/links")
public class AnalyticsController {

    private static final int RECENT_CLICKS_LIMIT = 100;

    private final LinkRepository links;
    private final ClickRepository clicks;

    public AnalyticsController(LinkRepository links, ClickRepository clicks) {
        this.links = links;
        this.clicks = clicks;
    }

    @GetMapping("/{linkId}/analytics")
    public AnalyticsResponse analytics(@PathVariable Long linkId, HttpServletRequest request) {
        User user = (User) request.getAttribute(AuthInterceptor.USER_ATTR);
        Link link = links.findById(linkId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "link not found"));
        // Same body for "doesn't exist" and "not yours" so we don't leak
        // existence of other tenants' links.
        if (!link.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "link not found");
        }
        long total = clicks.countByLinkId(linkId);
        List<Click> recent = clicks.findRecentByLink(
                linkId,
                PageRequest.of(0, RECENT_CLICKS_LIMIT, Sort.by(Sort.Direction.DESC, "occurredAt"))
        );
        List<ClickPoint> points = recent.stream()
                .map(c -> new ClickPoint(c.getOccurredAt(), c.getIpAddress(), c.getUserAgent(), c.getReferer()))
                .toList();
        return new AnalyticsResponse(
                link.getId(),
                link.getSlug(),
                total,
                points.isEmpty() ? null : points.get(0).timestamp(),
                points
        );
    }
}
