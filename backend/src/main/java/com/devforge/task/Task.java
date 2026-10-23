package com.devforge.task;

import com.devforge.project.Project;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
public class Task {

	public enum Status { TODO, IN_PROGRESS, REVIEW, DONE }
	public enum Priority { LOW, MEDIUM, HIGH }

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 160)
	private String title;

	@Column(length = 1000)
	private String description;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private Status status;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private Priority priority;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "project_id", nullable = false)
	@JsonIgnore
	private Project project;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	protected Task() {
	}

	public Task(String title, String description, Status status, Priority priority, Project project) {
		this.title = title;
		this.description = description;
		this.status = status;
		this.priority = priority;
		this.project = project;
	}

	@PrePersist
	void setCreatedAt() {
		createdAt = LocalDateTime.now();
	}

	public void update(String title, String description, Status status, Priority priority, Project project) {
		this.title = title;
		this.description = description;
		this.status = status;
		this.priority = priority;
		this.project = project;
	}

	public Long getId() { return id; }
	public String getTitle() { return title; }
	public String getDescription() { return description; }
	public Status getStatus() { return status; }
	public Priority getPriority() { return priority; }
	public LocalDateTime getCreatedAt() { return createdAt; }
	@JsonIgnore
	public Project getProject() { return project; }
}
