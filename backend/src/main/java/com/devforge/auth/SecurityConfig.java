package com.devforge.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {
	@Bean
	PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

	@Bean
	AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
		return configuration.getAuthenticationManager();
	}

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http, AccountDetailsService accounts,
			@Value("${devforge.demo.read-only:false}") boolean readOnlyDemo,
			@Value("${devforge.security.csrf.enabled:true}") boolean csrfEnabled) throws Exception {
		CookieCsrfTokenRepository csrf = CookieCsrfTokenRepository.withHttpOnlyFalse();
		csrf.setCookiePath("/");
		CsrfTokenRequestAttributeHandler csrfHandler = new CsrfTokenRequestAttributeHandler();
		http
			.cors(cors -> {})
			.csrf(config -> {
				if (csrfEnabled) config.csrfTokenRepository(csrf).csrfTokenRequestHandler(csrfHandler);
				else config.disable();
			})
			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
			.userDetailsService(accounts)
			.authorizeHttpRequests(auth -> {
				auth.requestMatchers(HttpMethod.GET, "/", "/index.html", "/assets/**", "/favicon.ico",
						"/favicon.svg", "/devforge-hero.png", "/icons.svg", "/robots.txt", "/site.webmanifest",
						"/manifest.webmanifest").permitAll();
				auth.requestMatchers(HttpMethod.HEAD, "/", "/index.html", "/assets/**", "/favicon.ico",
						"/favicon.svg", "/devforge-hero.png", "/icons.svg", "/robots.txt", "/site.webmanifest",
						"/manifest.webmanifest").permitAll();
				auth.requestMatchers("/api/status", "/api/health", "/api/auth/csrf", "/api/auth/login", "/api/auth/signup",
						"/api/snippets/shared/**").permitAll();
				if (readOnlyDemo) auth.requestMatchers(HttpMethod.GET, "/api/**").permitAll();
				auth.anyRequest().authenticated();
			})
			.formLogin(form -> form.disable())
			.httpBasic(basic -> basic.disable());
		return http.build();
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource(@Value("${app.cors.allowed-origin:http://localhost:5173}") String origin) {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOrigins(java.util.List.of(origin, "http://localhost:5173", "http://127.0.0.1:5173"));
		configuration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(java.util.List.of("Content-Type", "X-XSRF-TOKEN"));
		configuration.setAllowCredentials(true);
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/api/**", configuration);
		return source;
	}
}
