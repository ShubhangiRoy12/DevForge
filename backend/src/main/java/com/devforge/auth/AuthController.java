package com.devforge.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
	private final AuthService authService;
	private final AuthenticationManager authenticationManager;

	public AuthController(AuthService authService, AuthenticationManager authenticationManager) {
		this.authService = authService;
		this.authenticationManager = authenticationManager;
	}

	@GetMapping("/csrf")
	public Map<String, String> csrf(CsrfToken token) {
		return Map.of("headerName", token.getHeaderName(), "token", token.getToken());
	}

	@GetMapping("/me")
	public Map<String, String> me(Authentication authentication) {
		if (authentication == null || !authentication.isAuthenticated()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to continue.");
		}
		return authService.publicAccount(authentication.getName());
	}

	@PostMapping("/signup")
	public Map<String, String> signup(@Valid @RequestBody AuthRequest request, HttpServletRequest servletRequest) {
		String email = authService.signup(request);
		return establishSession(email, request.password(), servletRequest);
	}

	@PostMapping("/login")
	public Map<String, String> login(@Valid @RequestBody AuthRequest request, HttpServletRequest servletRequest) {
		return establishSession(request.email().trim().toLowerCase(), request.password(), servletRequest);
	}

	@PostMapping("/logout")
	public Map<String, String> logout(Authentication authentication, HttpServletRequest request,
			HttpServletResponse response) {
		new SecurityContextLogoutHandler().logout(request, response, authentication);
		return Map.of("message", "Signed out");
	}

	private Map<String, String> establishSession(String email, String password, HttpServletRequest request) {
		Authentication authentication = authenticationManager.authenticate(
				new UsernamePasswordAuthenticationToken(email, password));
		SecurityContext context = SecurityContextHolder.createEmptyContext();
		context.setAuthentication(authentication);
		SecurityContextHolder.setContext(context);
		request.getSession(true).setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);
		return authService.publicAccount(authentication.getName());
	}
}
