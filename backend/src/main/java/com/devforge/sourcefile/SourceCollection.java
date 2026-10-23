package com.devforge.sourcefile;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "source_collections")
public class SourceCollection {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 120)
	private String name;

	@Column(length = 1000)
	private String description;

	@Column(length = 254)
	private String ownerEmail;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(nullable = false)
	private LocalDateTime updatedAt;

	@JsonIgnore
	@OneToMany(mappedBy = "collection", cascade = CascadeType.REMOVE, orphanRemoval = true)
	private List<SourceFile> files = new ArrayList<>();

	protected SourceCollection() {
	}

	public SourceCollection(String name, String description, String ownerEmail) {
		this.name = name;
		this.description = description;
		this.ownerEmail = ownerEmail;
	}

	public SourceCollection(String name, String description) { this(name, description, null); }

	@PrePersist
	void onCreate() {
		createdAt = LocalDateTime.now();
		updatedAt = createdAt;
	}

	@PreUpdate
	void onUpdate() {
		updatedAt = LocalDateTime.now();
	}

	public void update(String name, String description) {
		this.name = name;
		this.description = description;
	}

	public Long getId() { return id; }
	public String getName() { return name; }
	public String getDescription() { return description; }
	public LocalDateTime getCreatedAt() { return createdAt; }
	public LocalDateTime getUpdatedAt() { return updatedAt; }
	@JsonIgnore
	public String getOwnerEmail() { return ownerEmail; }
}
