package com.devforge.sourcefile;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SourceFileRepository extends JpaRepository<SourceFile, Long> {
	List<SourceFile> findAllByCollection_IdOrderByNameAsc(Long collectionId);
	java.util.Optional<SourceFile> findByIdAndCollection_OwnerEmail(Long id, String ownerEmail);
}
