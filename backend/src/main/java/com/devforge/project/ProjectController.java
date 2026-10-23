package com.devforge.project;

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
@RequestMapping("/api/projects")
public class ProjectController {

	private final ProjectService projectService;

	public ProjectController(ProjectService projectService) {
		this.projectService = projectService;
	}

	@GetMapping
	public List<Project> findAll(Principal principal) {
		return projectService.findAll(owner(principal));
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public Project create(@Valid @RequestBody ProjectRequest request, Principal principal) {
		return projectService.create(request, owner(principal));
	}

	@PutMapping("/{id}")
	public Project update(@PathVariable Long id, @Valid @RequestBody ProjectRequest request, Principal principal) {
		return projectService.update(id, request, owner(principal));
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable Long id, Principal principal) {
		projectService.delete(id, owner(principal));
	}

	private String owner(Principal principal) { return principal == null || "anonymousUser".equals(principal.getName()) ? null : principal.getName(); }
}
