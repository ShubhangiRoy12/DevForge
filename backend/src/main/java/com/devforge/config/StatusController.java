package com.devforge.config;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/status")
public class StatusController {

	private final boolean readOnly;

	public StatusController(@Value("${devforge.demo.read-only:false}") boolean readOnly) {
		this.readOnly = readOnly;
	}

	@GetMapping
	public Map<String, Object> status() {
		return Map.of("status", "ok", "app", "DevForge", "readOnly", readOnly);
	}
}
