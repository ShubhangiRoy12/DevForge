package com.devforge.sourcefile;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SourceFileService {

	private final SourceFileRepository fileRepository;
	private final SourceCollectionRepository collectionRepository;

	public SourceFileService(SourceFileRepository fileRepository, SourceCollectionRepository collectionRepository) {
		this.fileRepository = fileRepository;
		this.collectionRepository = collectionRepository;
	}

	public List<SourceFile> findByCollection(Long collectionId, String ownerEmail) {
		findCollection(collectionId, ownerEmail);
		return fileRepository.findAllByCollection_IdOrderByNameAsc(collectionId);
	}

	public SourceFile create(Long collectionId, SourceFileRequest request, String ownerEmail) {
		return fileRepository.save(new SourceFile(request.name().trim(), request.language().trim(), request.content(),
				findCollection(collectionId, ownerEmail)));
	}

	public SourceFile update(Long id, SourceFileRequest request, String ownerEmail) {
		SourceFile file = fileRepository.findByIdAndCollection_OwnerEmail(id, ownerEmail)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Source file not found"));
		file.update(request.name().trim(), request.language().trim(), request.content());
		return fileRepository.save(file);
	}

	public void delete(Long id, String ownerEmail) {
		SourceFile file = fileRepository.findByIdAndCollection_OwnerEmail(id, ownerEmail)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Source file not found"));
		fileRepository.delete(file);
	}

	private SourceCollection findCollection(Long id, String ownerEmail) {
		return collectionRepository.findByIdAndOwnerEmail(id, ownerEmail)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Collection not found"));
	}
}
