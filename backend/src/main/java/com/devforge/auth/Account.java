package com.devforge.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "accounts")
public class Account {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 254)
	private String email;

	@Column(nullable = false, length = 80)
	private String displayName;

	@Column(nullable = false)
	private String passwordHash;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	protected Account() {}

	public Account(String email, String displayName, String passwordHash) {
		this.email = email;
		this.displayName = displayName;
		this.passwordHash = passwordHash;
	}

	@PrePersist
	void onCreate() { createdAt = LocalDateTime.now(); }

	public Long getId() { return id; }
	public String getEmail() { return email; }
	public String getDisplayName() { return displayName; }
	public String getPasswordHash() { return passwordHash; }
}
