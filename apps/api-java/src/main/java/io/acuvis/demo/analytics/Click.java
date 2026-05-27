package io.acuvis.demo.analytics;

import java.time.Instant;

import io.acuvis.demo.links.Link;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "clicks", indexes = @Index(name = "idx_click_link_id", columnList = "link_id"))
public class Click {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "link_id", nullable = false)
    private Link link;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt = Instant.now();

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    @Column(name = "referer", length = 2048)
    private String referer;

    public Long getId() { return id; }
    public Link getLink() { return link; }
    public void setLink(Link link) { this.link = link; }
    public Instant getOccurredAt() { return occurredAt; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    public String getReferer() { return referer; }
    public void setReferer(String referer) { this.referer = referer; }
}
