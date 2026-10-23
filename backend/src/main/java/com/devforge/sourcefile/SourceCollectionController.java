package com.devforge.sourcefile;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import java.security.Principal;

@RestController
@RequestMapping("/api/collections")
public class SourceCollectionController {

	private final SourceCollectionService collectionService;
	private final SourceFileService fileService;

	public SourceCollectionController(SourceCollectionService collectionService, SourceFileService fileService) {
		this.collectionService = collectionService;
		this.fileService = fileService;
	}

	@GetMapping
	public List<SourceCollection> findAll(Principal principal) {
		return collectionService.findAll(owner(principal));
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public SourceCollection create(@Valid @RequestBody CollectionRequest request, Principal principal) {
		return collectionService.create(request, owner(principal));
	}

	@PutMapping("/{id}")
	public SourceCollection update(@PathVariable Long id, @Valid @RequestBody CollectionRequest request, Principal principal) {
		return collectionService.update(id, request, owner(principal));
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable Long id, Principal principal) {
		collectionService.delete(id, owner(principal));
	}

	@GetMapping("/{collectionId}/files")
	public List<SourceFile> findFiles(@PathVariable Long collectionId, Principal principal) {
		return fileService.findByCollection(collectionId, owner(principal));
	}

	@PostMapping("/{collectionId}/files")
	@ResponseStatus(HttpStatus.CREATED)
	public SourceFile createFile(@PathVariable Long collectionId, @Valid @RequestBody SourceFileRequest request, Principal principal) {
		return fileService.create(collectionId, request, owner(principal));
	}

	private String owner(Principal principal) { return principal == null || "anonymousUser".equals(principal.getName()) ? null : principal.getName(); }
}
