package com.devforge;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"test", "demo"})
class ReadOnlyDemoIntegrationTests {

	@Autowired private MockMvc mockMvc;

	@Test
	void allowsReadsAndRejectsApiWrites() throws Exception {
		mockMvc.perform(get("/api/status"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.readOnly").value(true));

		mockMvc.perform(get("/api/projects"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(2)));
		mockMvc.perform(get("/api/snippets"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(1)));

		mockMvc.perform(post("/api/projects").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"Should be blocked","description":""}
						"""))
				.andExpect(status().isForbidden());
	}
}
