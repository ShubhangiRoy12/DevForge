package com.devforge.auth;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.devforge.project.ProjectRepository;
import com.devforge.snippet.SnippetRepository;
import com.devforge.sourcefile.SourceCollectionRepository;

@Service
public class AuthService {
	private final AccountRepository accounts;
	private final PasswordEncoder passwordEncoder;
	private final ProjectRepository projects;
	private final SnippetRepository snippets;
	private final SourceCollectionRepository collections;

	public AuthService(AccountRepository accounts, PasswordEncoder passwordEncoder, ProjectRepository projects,
			SnippetRepository snippets, SourceCollectionRepository collections) {
		this.accounts = accounts;
		this.passwordEncoder = passwordEncoder;
		this.projects = projects;
		this.snippets = snippets;
		this.collections = collections;
	}

	@Transactional
	public String signup(AuthRequest request) {
		String email = request.email().trim().toLowerCase();
		if (accounts.existsByEmail(email)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
		}
		String name = request.displayName() == null || request.displayName().isBlank()
				? email.substring(0, email.indexOf('@')) : request.displayName().trim();
		boolean firstAccount = accounts.count() == 0;
		accounts.save(new Account(email, name, passwordEncoder.encode(request.password())));
		if (firstAccount) {
			projects.claimUnowned(email);
			snippets.claimUnowned(email);
			collections.claimUnowned(email);
		}
		return email;
	}

	public Map<String, String> publicAccount(String email) {
		Account account = accounts.findByEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account not found."));
		return Map.of("email", account.getEmail(), "displayName", account.getDisplayName());
	}
}
