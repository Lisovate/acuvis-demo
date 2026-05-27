package io.acuvis.demo.analytics;

import io.acuvis.demo.links.Link;
import org.springframework.stereotype.Service;

/**
 * Persists click events for successful redirects.
 *
 * <p>Called inline from {@link io.acuvis.demo.links.RedirectController} —
 * fast enough on SQLite for the demo. Production deployments should
 * swap this for an async queue (Redis/SQS) so a slow database doesn't
 * slow the redirect.
 */
@Service
public class ClickService {

    private final ClickRepository repo;

    public ClickService(ClickRepository repo) {
        this.repo = repo;
    }

    public void record(Link link, String ipAddress, String userAgent, String referer) {
        Click click = new Click();
        click.setLink(link);
        click.setIpAddress(ipAddress);
        click.setUserAgent(userAgent);
        click.setReferer(referer);
        repo.save(click);
    }
}
