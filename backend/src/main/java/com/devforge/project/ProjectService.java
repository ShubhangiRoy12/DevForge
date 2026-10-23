package com.devforge.project;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProjectService {

	private final ProjectRepository projectRepository;

	public ProjectService(ProjectRepository projectRepository) {
		this.projectRepository = projectRepository;
	}

	public List<Project> findAll(String ownerEmail) {
		return ownerEmail == null ? projectRepository.findAllByOwnerEmailIsNullOrderByCreatedAtDesc()
				: projectRepository.findAllByOwnerEmailOrderByCreatedAtDesc(ownerEmail);
	}

	public Project create(ProjectRequest request, String ownerEmail) {
		return projectRepository.save(new Project(request.name().trim(), cleanDescription(request.description()), ownerEmail));
	}

	public Project update(Long id, ProjectRequest request, String ownerEmail) {
		Project project = findById(id, ownerEmail);
		project.update(request.name().trim(), cleanDescription(request.description()));
		return projectRepository.save(project);
	}

	public void delete(Long id, String ownerEmail) {
		projectRepository.delete(findById(id, ownerEmail));
	}

	public Project findById(Long id, String ownerEmail) {
		return projectRepository.findByIdAndOwnerEmail(id, ownerEmail)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
	}

	private String cleanDescription(String description) {
		return description == null ? "" : description.trim();
	}
}
