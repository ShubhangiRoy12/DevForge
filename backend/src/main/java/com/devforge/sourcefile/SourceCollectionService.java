package com.devforge.sourcefile;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SourceCollectionService {

	private final SourceCollectionRepository collectionRepository;

	public SourceCollectionService(SourceCollectionRepository collectionRepository) {
		this.collectionRepository = collectionRepository;
	}

	public List<SourceCollection> findAll(String ownerEmail) {
		return ownerEmail == null ? collectionRepository.findAllByOwnerEmailIsNullOrderByUpdatedAtDesc()
				: collectionRepository.findAllByOwnerEmailOrderByUpdatedAtDesc(ownerEmail);
	}

	public SourceCollection create(CollectionRequest request, String ownerEmail) {
		return collectionRepository.save(new SourceCollection(request.name().trim(), cleanDescription(request.description()), ownerEmail));
	}

	public SourceCollection update(Long id, CollectionRequest request, String ownerEmail) {
		SourceCollection collection = findById(id, ownerEmail);
		collection.update(request.name().trim(), cleanDescription(request.description()));
		return collectionRepository.save(collection);
	}

	public void delete(Long id, String ownerEmail) {
		collectionRepository.delete(findById(id, ownerEmail));
	}

	public SourceCollection findById(Long id, String ownerEmail) {
		return collectionRepository.findByIdAndOwnerEmail(id, ownerEmail)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Collection not found"));
	}

	private String cleanDescription(String description) {
		return description == null ? "" : description.trim();
	}
}
