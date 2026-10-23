package com.devforge.snippet;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SnippetRepository extends JpaRepository<Snippet, Long> {
	@Query("select s from Snippet s where s.ownerEmail = :owner and (:term is null or lower(s.title) like lower(concat('%', :term, '%')) or lower(s.language) like lower(concat('%', :term, '%')) or lower(s.description) like lower(concat('%', :term, '%')) or lower(s.code) like lower(concat('%', :term, '%'))) order by s.updatedAt desc")
	List<Snippet> searchOwned(@Param("owner") String owner, @Param("term") String term);
	@Query("select s from Snippet s where s.ownerEmail is null and (:term is null or lower(s.title) like lower(concat('%', :term, '%')) or lower(s.language) like lower(concat('%', :term, '%')) or lower(s.description) like lower(concat('%', :term, '%')) or lower(s.code) like lower(concat('%', :term, '%'))) order by s.updatedAt desc")
	List<Snippet> searchUnowned(@Param("term") String term);
	java.util.Optional<Snippet> findByIdAndOwnerEmail(Long id, String ownerEmail);
	@org.springframework.data.jpa.repository.Modifying @org.springframework.transaction.annotation.Transactional
	@Query("update Snippet s set s.ownerEmail = :email where s.ownerEmail is null")
	int claimUnowned(@Param("email") String email);

	Optional<Snippet> findByShareIdAndSharedTrue(UUID shareId);
}
