package com.devforge.project;

import jakarta.persistence.Column;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.OneToMany;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.devforge.task.Task;
import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;

@Entity
@Table(name = "projects")
public class Project {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String name;

	@Column(length = 1000)
	private String description;

	@Column(length = 254)
	private String ownerEmail;

	@Column(updatable = false)
	private LocalDateTime createdAt;

	@JsonIgnore
	@OneToMany(mappedBy = "project", cascade = CascadeType.REMOVE, orphanRemoval = true)
	private List<Task> tasks = new ArrayList<>();

	protected Project() {
	}

	public Project(String name, String description, String ownerEmail) {
		this.name = name;
		this.description = description;
		this.ownerEmail = ownerEmail;
	}

	public Project(String name, String description) { this(name, description, null); }

	@PrePersist
	void setCreatedAt() {
		createdAt = LocalDateTime.now();
	}

	public void update(String name, String description) {
		this.name = name;
		this.description = description;
	}

	public Long getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public String getDescription() {
		return description;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	@JsonIgnore
	public String getOwnerEmail() { return ownerEmail; }
}
