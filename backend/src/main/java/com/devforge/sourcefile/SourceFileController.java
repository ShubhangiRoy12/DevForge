package com.devforge.sourcefile;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import java.security.Principal;

@RestController
@RequestMapping("/api/source-files")
public class SourceFileController {

	private final SourceFileService fileService;

	public SourceFileController(SourceFileService fileService) {
		this.fileService = fileService;
	}

	@PutMapping("/{id}")
	public SourceFile update(@PathVariable Long id, @Valid @RequestBody SourceFileRequest request, Principal principal) {
		return fileService.update(id, request, owner(principal));
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable Long id, Principal principal) {
		fileService.delete(id, owner(principal));
	}

	private String owner(Principal principal) { return principal == null || "anonymousUser".equals(principal.getName()) ? null : principal.getName(); }
}
