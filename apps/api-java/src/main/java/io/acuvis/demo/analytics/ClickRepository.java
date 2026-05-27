package io.acuvis.demo.analytics;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClickRepository extends JpaRepository<Click, Long> {

    long countByLinkId(Long linkId);

    @Query("select c from Click c where c.link.id = :linkId order by c.occurredAt desc")
    List<Click> findRecentByLink(@Param("linkId") Long linkId, Pageable pageable);
}
