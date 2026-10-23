package com.devforge.task;

import com.devforge.project.Project;
import com.devforge.project.ProjectRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService {

	private final TaskRepository taskRepository;
	private final ProjectRepository projectRepository;

	public TaskService(TaskRepository taskRepository, ProjectRepository projectRepository) {
		this.taskRepository = taskRepository;
		this.projectRepository = projectRepository;
	}

	public List<Task> findByProject(Long projectId, String ownerEmail) {
		findProject(projectId, ownerEmail);
		return taskRepository.findAllByProject_IdOrderByCreatedAtDesc(projectId);
	}

	public Task create(TaskRequest request, String ownerEmail) {
		Project project = findProject(request.projectId(), ownerEmail);
		return taskRepository.save(new Task(request.title().trim(), cleanDescription(request.description()),
				request.status(), request.priority(), project));
	}

	@Transactional
	public Task update(Long id, TaskRequest request, String ownerEmail) {
		Task task = taskRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
		if (task.getProject().getOwnerEmail() == null || !task.getProject().getOwnerEmail().equals(ownerEmail)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found");
		task.update(request.title().trim(), cleanDescription(request.description()), request.status(),
				request.priority(), findProject(request.projectId(), ownerEmail));
		return taskRepository.save(task);
	}

	@Transactional
	public void delete(Long id, String ownerEmail) {
		Task task = taskRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
		if (task.getProject().getOwnerEmail() == null || !task.getProject().getOwnerEmail().equals(ownerEmail)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found");
		taskRepository.delete(task);
	}

	private Project findProject(Long id, String ownerEmail) {
		return projectRepository.findByIdAndOwnerEmail(id, ownerEmail)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
	}

	private String cleanDescription(String description) {
		return description == null ? "" : description.trim();
	}
}
