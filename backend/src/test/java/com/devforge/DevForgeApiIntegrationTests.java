package com.devforge;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devforge.project.ProjectRepository;
import com.devforge.snippet.SnippetRepository;
import com.devforge.sourcefile.SourceCollectionRepository;
import com.devforge.sourcefile.SourceFileRepository;
import com.devforge.task.TaskRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(username = "owner@example.com")
class DevForgeApiIntegrationTests {

	@Autowired private MockMvc mockMvc;
	@Autowired private ObjectMapper objectMapper;
	@Autowired private ProjectRepository projectRepository;
	@Autowired private TaskRepository taskRepository;
	@Autowired private SnippetRepository snippetRepository;
	@Autowired private SourceCollectionRepository collectionRepository;
	@Autowired private SourceFileRepository fileRepository;

	@BeforeEach
	void clearDatabase() {
		fileRepository.deleteAll();
		collectionRepository.deleteAll();
		taskRepository.deleteAll();
		projectRepository.deleteAll();
		snippetRepository.deleteAll();
	}

	@Test
	@WithAnonymousUser
	void publicHomepageLoadsWhilePrivateProjectApiRemainsProtected() throws Exception {
		mockMvc.perform(get("/")).andExpect(status().isOk());

		mockMvc.perform(get("/api/projects")).andExpect(status().isForbidden());
	}

	@Test
	void validatesProjectInputAndPersistsUpdates() throws Exception {
		mockMvc.perform(post("/api/projects").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"  ","description":""}
						"""))
				.andExpect(status().isBadRequest());

		MvcResult created = mockMvc.perform(post("/api/projects").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"DevForge","description":"Workspace"}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.name").value("DevForge"))
				.andReturn();
		long id = json(created).get("id").asLong();

		mockMvc.perform(put("/api/projects/{id}", id).contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"DevForge 2","description":"Updated"}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("DevForge 2"));

		mockMvc.perform(get("/api/projects")).andExpect(status().isOk())
				.andExpect(jsonPath("$[0].description").value("Updated"));
	}

	@Test
	void taskRequiresAnExistingProjectAndIsRemovedWithItsProject() throws Exception {
		mockMvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"projectId":999,"title":"Task","description":"","status":"TODO","priority":"LOW"}
						"""))
				.andExpect(status().isNotFound());

		long projectId = createProject();
		MvcResult task = mockMvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"projectId":%d,"title":"Test API","description":"","status":"TODO","priority":"HIGH"}
						""".formatted(projectId)))
				.andExpect(status().isCreated()).andReturn();
		long taskId = json(task).get("id").asLong();

		mockMvc.perform(put("/api/tasks/{id}", taskId).contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"projectId":%d,"title":"Test API","description":"","status":"REVIEW","priority":"HIGH"}
						""".formatted(projectId)))
				.andExpect(status().isOk()).andExpect(jsonPath("$.status").value("REVIEW"));

		mockMvc.perform(delete("/api/projects/{id}", projectId)).andExpect(status().isNoContent());
		mockMvc.perform(get("/api/tasks").param("projectId", String.valueOf(projectId)))
				.andExpect(status().isNotFound());
	}

	@Test
	void snippetShareCanBeEnabledAndRevoked() throws Exception {
		MvcResult created = mockMvc.perform(post("/api/snippets").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"title":"Greeting","language":"java","description":"","code":"System.out.println(42);"}
						"""))
				.andExpect(status().isCreated()).andReturn();
		long id = json(created).get("id").asLong();

		MvcResult shared = mockMvc.perform(post("/api/snippets/{id}/share", id))
				.andExpect(status().isOk()).andExpect(jsonPath("$.shared").value(true)).andReturn();
		String shareId = json(shared).get("shareId").asText();
		mockMvc.perform(get("/api/snippets/shared/{shareId}", shareId))
				.andExpect(status().isOk()).andExpect(jsonPath("$.code").value("System.out.println(42);"));

		mockMvc.perform(delete("/api/snippets/{id}/share", id)).andExpect(status().isNoContent());
		mockMvc.perform(get("/api/snippets/shared/{shareId}", shareId)).andExpect(status().isNotFound());
	}

	@Test
	void collectionDeletionRemovesItsFiles() throws Exception {
		MvcResult collection = mockMvc.perform(post("/api/collections").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"Java","description":"Examples"}
						"""))
				.andExpect(status().isCreated()).andReturn();
		long id = json(collection).get("id").asLong();

		mockMvc.perform(post("/api/collections/{id}/files", id).contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"Hello.java","language":"java","content":"class Hello {}"}
						"""))
				.andExpect(status().isCreated());
		mockMvc.perform(delete("/api/collections/{id}", id)).andExpect(status().isNoContent());
		mockMvc.perform(get("/api/collections/{id}/files", id)).andExpect(status().isNotFound());
	}

	private long createProject() throws Exception {
		MvcResult result = mockMvc.perform(post("/api/projects").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"DevForge","description":"Workspace"}
						"""))
				.andExpect(status().isCreated()).andReturn();
		return json(result).get("id").asLong();
	}

	private JsonNode json(MvcResult result) throws Exception {
		return objectMapper.readTree(result.getResponse().getContentAsString());
	}
}
