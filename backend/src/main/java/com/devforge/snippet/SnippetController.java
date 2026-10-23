package com.devforge.snippet;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import java.security.Principal;

@RestController
@RequestMapping("/api/snippets")
public class SnippetController {

	private final SnippetService snippetService;

	public SnippetController(SnippetService snippetService) {
		this.snippetService = snippetService;
	}

	@GetMapping
	public List<Snippet> search(@RequestParam(required = false) String query, Principal principal) {
		return snippetService.search(query, owner(principal));
	}

	@GetMapping("/shared/{shareId}")
	public Snippet findShared(@PathVariable UUID shareId) {
		return snippetService.findShared(shareId);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public Snippet create(@Valid @RequestBody SnippetRequest request, Principal principal) {
		return snippetService.create(request, owner(principal));
	}

	@PutMapping("/{id}")
	public Snippet update(@PathVariable Long id, @Valid @RequestBody SnippetRequest request, Principal principal) {
		return snippetService.update(id, request, owner(principal));
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable Long id, Principal principal) {
		snippetService.delete(id, owner(principal));
	}

	@PostMapping("/{id}/share")
	public Snippet enableSharing(@PathVariable Long id, Principal principal) {
		return snippetService.enableSharing(id, owner(principal));
	}

	@DeleteMapping("/{id}/share")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void disableSharing(@PathVariable Long id, Principal principal) {
		snippetService.disableSharing(id, owner(principal));
	}

	private String owner(Principal principal) { return principal == null || "anonymousUser".equals(principal.getName()) ? null : principal.getName(); }
}
