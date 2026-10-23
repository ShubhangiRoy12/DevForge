package com.devforge.task;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import java.security.Principal;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

	private final TaskService taskService;

	public TaskController(TaskService taskService) {
		this.taskService = taskService;
	}

	@GetMapping
	public List<Task> findByProject(@RequestParam Long projectId, Principal principal) {
		return taskService.findByProject(projectId, owner(principal));
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public Task create(@Valid @RequestBody TaskRequest request, Principal principal) {
		return taskService.create(request, owner(principal));
	}

	@PutMapping("/{id}")
	public Task update(@PathVariable Long id, @Valid @RequestBody TaskRequest request, Principal principal) {
		return taskService.update(id, request, owner(principal));
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable Long id, Principal principal) {
		taskService.delete(id, owner(principal));
	}

	private String owner(Principal principal) { return principal == null || "anonymousUser".equals(principal.getName()) ? null : principal.getName(); }
}
