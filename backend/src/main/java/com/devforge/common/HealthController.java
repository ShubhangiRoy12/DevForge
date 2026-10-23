package com.devforge.common;

import java.time.Instant;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

	@GetMapping
	public HealthResponse getHealth() {
		return new HealthResponse("ok", "DevForge", Instant.now());
	}

	public record HealthResponse(String status, String app, Instant timestamp) {
	}
}
