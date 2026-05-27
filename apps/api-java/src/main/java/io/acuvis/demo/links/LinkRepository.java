package io.acuvis.demo.links;

import java.util.List;
import java.util.Optional;

import io.acuvis.demo.auth.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LinkRepository extends JpaRepository<Link, Long> {

    Optional<Link> findBySlug(String slug);

    List<Link> findByOwnerOrderByCreatedAtDesc(User owner);

    boolean existsBySlug(String slug);
}
