package com.devforge;

import java.net.URI;
import java.net.http.*;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.beans.factory.annotation.Autowired;
import com.devforge.project.Project;
import com.devforge.project.ProjectRepository;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "spring.datasource.url=jdbc:h2:mem:project-api-test")
@ActiveProfiles("test")
class ProjectApiTest {
    @LocalServerPort int port;
    @Autowired ProjectRepository projects;
    private final CookieManager cookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
    private final HttpClient client = HttpClient.newBuilder().cookieHandler(cookies).build();

    private HttpResponse<String> send(String path, String method, String body) throws Exception {
        var builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
        if (body != null) builder.header("Content-Type", "application/json").method(method, HttpRequest.BodyPublishers.ofString(body));
        else builder.method(method, HttpRequest.BodyPublishers.noBody());
        return client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> create(String body) throws Exception {
        return client.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/projects"))
                .header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(body)).build(),
                HttpResponse.BodyHandlers.ofString());
    }

    @Test
    void createsListsAndValidatesProjects() throws Exception {
        assertThat(send("/api/projects", "GET", null).statusCode()).isEqualTo(403);
        projects.save(new Project("Existing local work", "Preserved when the first account is created."));
        assertThat(send("/api/auth/signup", "POST", "{\"email\":\"" + UUID.randomUUID() + "@example.com\",\"password\":\"secure-pass-123\",\"displayName\":\"Demo User\"}").statusCode()).isEqualTo(200);
        assertThat(create("{\"name\":\"   \"}").statusCode()).isEqualTo(400);
        assertThat(create("{\"name\":\"" + "x".repeat(121) + "\"}").statusCode()).isEqualTo(400);
        var created = create("{\"name\":\"  Portfolio  \",\"description\":\"My site\"}");
        assertThat(created.statusCode()).isEqualTo(201);
        assertThat(created.body()).contains("\"name\":\"Portfolio\"", "\"id\":");
        var listed = send("/api/projects", "GET", null);
        assertThat(listed.statusCode()).isEqualTo(200);
        assertThat(listed.body()).contains("Portfolio", "My site", "Existing local work");
        assertThat(send("/api/snippets", "POST", "{\"title\":\"Greeting\",\"language\":\"java\",\"description\":\"\",\"code\":\"hello()\"}").statusCode()).isEqualTo(201);
        var collection = send("/api/collections", "POST", "{\"name\":\"Java\",\"description\":\"\"}");
        assertThat(collection.statusCode()).isEqualTo(201);
        long collectionId = new tools.jackson.databind.ObjectMapper().readTree(collection.body()).get("id").asLong();
        assertThat(send("/api/collections/" + collectionId + "/files", "POST", "{\"name\":\"Hello.java\",\"language\":\"java\",\"content\":\"class Hello {}\"}").statusCode()).isEqualTo(201);

        CookieManager otherCookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
        HttpClient other = HttpClient.newBuilder().cookieHandler(otherCookies).build();
        var otherSignup = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/auth/signup"))
                .header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(
                        "{\"email\":\"" + UUID.randomUUID() + "@example.com\",\"password\":\"secure-pass-456\"}" )).build();
        assertThat(other.send(otherSignup, HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(200);
        var otherProjects = other.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/projects")).GET().build(), HttpResponse.BodyHandlers.ofString());
        assertThat(otherProjects.body()).doesNotContain("Portfolio", "Existing local work");
        var otherSnippets = other.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/snippets")).GET().build(), HttpResponse.BodyHandlers.ofString());
        assertThat(otherSnippets.body()).doesNotContain("Greeting");
        var otherCollections = other.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/collections")).GET().build(), HttpResponse.BodyHandlers.ofString());
        assertThat(otherCollections.body()).doesNotContain("Java");
        var otherFiles = other.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/collections/" + collectionId + "/files")).GET().build(), HttpResponse.BodyHandlers.ofString());
        assertThat(otherFiles.statusCode()).isEqualTo(404);
    }
}
