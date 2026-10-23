package com.devforge.sourcefile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CollectionRequest(
		@NotBlank @Size(max = 120) String name,
		@Size(max = 1000) String description) {
}
