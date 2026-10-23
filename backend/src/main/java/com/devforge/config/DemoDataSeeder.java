package com.devforge.config;

import com.devforge.project.Project;
import com.devforge.project.ProjectRepository;
import com.devforge.snippet.Snippet;
import com.devforge.snippet.SnippetRepository;
import com.devforge.sourcefile.SourceCollection;
import com.devforge.sourcefile.SourceCollectionRepository;
import com.devforge.sourcefile.SourceFile;
import com.devforge.sourcefile.SourceFileRepository;
import com.devforge.task.Task;
import com.devforge.task.TaskRepository;
import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("demo")
public class DemoDataSeeder implements ApplicationRunner {

	private final ProjectRepository projectRepository;
	private final TaskRepository taskRepository;
	private final SnippetRepository snippetRepository;
	private final SourceCollectionRepository collectionRepository;
	private final SourceFileRepository fileRepository;

	public DemoDataSeeder(ProjectRepository projectRepository, TaskRepository taskRepository,
			SnippetRepository snippetRepository, SourceCollectionRepository collectionRepository,
			SourceFileRepository fileRepository) {
		this.projectRepository = projectRepository;
		this.taskRepository = taskRepository;
		this.snippetRepository = snippetRepository;
		this.collectionRepository = collectionRepository;
		this.fileRepository = fileRepository;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (projectRepository.count() > 0 || taskRepository.count() > 0 || snippetRepository.count() > 0
				|| collectionRepository.count() > 0 || fileRepository.count() > 0) return;

		Project devForge = projectRepository.save(new Project("DevForge", "A personal workspace for projects and code."));
		Project netObserve = projectRepository.save(new Project("NetObserve", "Network telemetry and incident triage."));
		taskRepository.saveAll(List.of(
				new Task("Review project structure", "Keep the backend modular and easy to navigate.", Task.Status.DONE,
						Task.Priority.MEDIUM, devForge),
				new Task("Add API integration tests", "Cover validation and project-task relationships.", Task.Status.IN_PROGRESS,
						Task.Priority.HIGH, devForge),
				new Task("Document deployment settings", "List required environment variables.", Task.Status.TODO,
						Task.Priority.LOW, devForge),
				new Task("Review alert thresholds", "Check recall and false-positive tradeoffs.", Task.Status.TODO,
						Task.Priority.MEDIUM, netObserve)));
		snippetRepository.save(new Snippet("Hello from Java", "java", "A small runnable example.",
				"public class Hello {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, DevForge!\");\n    }\n}"));
		SourceCollection collection = collectionRepository.save(new SourceCollection("Java practice", "Small examples for learning Java."));
		fileRepository.save(new SourceFile("Hello.java", "java",
				"public class Hello {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, DevForge!\");\n    }\n}", collection));
	}
}
