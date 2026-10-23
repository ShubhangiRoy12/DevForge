package com.devforge.sourcefile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SourceFileRequest(
		@NotBlank @Size(max = 160) String name,
		@NotBlank @Size(max = 40) String language,
		@NotBlank @Size(max = 30000) String content) {
}
