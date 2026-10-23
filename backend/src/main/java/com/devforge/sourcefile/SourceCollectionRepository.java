package com.devforge.sourcefile;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface SourceCollectionRepository extends JpaRepository<SourceCollection, Long> {
	List<SourceCollection> findAllByOwnerEmailOrderByUpdatedAtDesc(String ownerEmail);
	List<SourceCollection> findAllByOwnerEmailIsNullOrderByUpdatedAtDesc();
	Optional<SourceCollection> findByIdAndOwnerEmail(Long id, String ownerEmail);
	@Modifying @Transactional
	@Query("update SourceCollection c set c.ownerEmail = :email where c.ownerEmail is null")
	int claimUnowned(@Param("email") String email);
}
