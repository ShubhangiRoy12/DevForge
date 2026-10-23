package com.devforge.project;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface ProjectRepository extends JpaRepository<Project, Long> {
	List<Project> findAllByOwnerEmailOrderByCreatedAtDesc(String ownerEmail);
	List<Project> findAllByOwnerEmailIsNullOrderByCreatedAtDesc();
	Optional<Project> findByIdAndOwnerEmail(Long id, String ownerEmail);
	@Modifying @Transactional
	@Query("update Project p set p.ownerEmail = :email where p.ownerEmail is null")
	int claimUnowned(@Param("email") String email);
}
