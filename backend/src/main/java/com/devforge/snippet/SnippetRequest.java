package com.devforge.snippet;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SnippetRequest(
		@NotBlank @Size(max = 160) String title,
		@NotBlank @Size(max = 40) String language,
		@Size(max = 1000) String description,
		@NotBlank @Size(max = 30000) String code) {
}
