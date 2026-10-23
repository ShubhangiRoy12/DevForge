package com.devforge.snippet;

import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SnippetService {

	private final SnippetRepository snippetRepository;

	public SnippetService(SnippetRepository snippetRepository) {
		this.snippetRepository = snippetRepository;
	}

	public List<Snippet> search(String query, String ownerEmail) {
		String term = query == null || query.isBlank() ? null : query.trim();
		return ownerEmail == null ? snippetRepository.searchUnowned(term) : snippetRepository.searchOwned(ownerEmail, term);
	}

	public Snippet create(SnippetRequest request, String ownerEmail) {
		return snippetRepository.save(new Snippet(request.title().trim(), request.language().trim(),
				cleanDescription(request.description()), request.code(), ownerEmail));
	}

	public Snippet update(Long id, SnippetRequest request, String ownerEmail) {
		Snippet snippet = findById(id, ownerEmail);
		snippet.update(request.title().trim(), request.language().trim(), cleanDescription(request.description()), request.code());
		return snippetRepository.save(snippet);
	}

	public void delete(Long id, String ownerEmail) {
		snippetRepository.delete(findById(id, ownerEmail));
	}

	public Snippet enableSharing(Long id, String ownerEmail) {
		Snippet snippet = findById(id, ownerEmail);
		snippet.setShared(true);
		return snippetRepository.save(snippet);
	}

	public void disableSharing(Long id, String ownerEmail) {
		Snippet snippet = findById(id, ownerEmail);
		snippet.setShared(false);
		snippetRepository.save(snippet);
	}

	public Snippet findShared(UUID shareId) {
		return snippetRepository.findByShareIdAndSharedTrue(shareId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared snippet not found"));
	}

	private Snippet findById(Long id, String ownerEmail) {
		return snippetRepository.findByIdAndOwnerEmail(id, ownerEmail)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Snippet not found"));
	}

	private String cleanDescription(String description) {
		return description == null ? "" : description.trim();
	}
}
