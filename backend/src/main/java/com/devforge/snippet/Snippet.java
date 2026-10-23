package com.devforge.snippet;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "snippets")
public class Snippet {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 160)
	private String title;

	@Column(nullable = false, length = 40)
	private String language;

	@Column(length = 1000)
	private String description;

	@Column(nullable = false, length = 30000)
	private String code;

	@Column(nullable = false, unique = true, updatable = false)
	private UUID shareId;

	@Column(nullable = false)
	private boolean shared;

	@Column(length = 254)
	private String ownerEmail;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(nullable = false)
	private LocalDateTime updatedAt;

	protected Snippet() {
	}

	public Snippet(String title, String language, String description, String code, String ownerEmail) {
		this.title = title;
		this.language = language;
		this.description = description;
		this.code = code;
		this.shareId = UUID.randomUUID();
		this.shared = false;
		this.ownerEmail = ownerEmail;
	}

	public Snippet(String title, String language, String description, String code) {
		this(title, language, description, code, null);
	}

	@PrePersist
	void onCreate() {
		createdAt = LocalDateTime.now();
		updatedAt = createdAt;
	}

	@PreUpdate
	void onUpdate() {
		updatedAt = LocalDateTime.now();
	}

	public void update(String title, String language, String description, String code) {
		this.title = title;
		this.language = language;
		this.description = description;
		this.code = code;
	}

	public void setShared(boolean shared) {
		this.shared = shared;
	}

	public Long getId() { return id; }
	public String getTitle() { return title; }
	public String getLanguage() { return language; }
	public String getDescription() { return description; }
	public String getCode() { return code; }
	public String getShareId() { return shared ? shareId.toString() : null; }
	public boolean isShared() { return shared; }
	public LocalDateTime getCreatedAt() { return createdAt; }
	public LocalDateTime getUpdatedAt() { return updatedAt; }
	@JsonIgnore
	public String getOwnerEmail() { return ownerEmail; }
}
