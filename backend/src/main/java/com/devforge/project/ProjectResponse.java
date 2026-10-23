package com.devforge.project;
public record ProjectResponse(Long id,String name,String description) {
 static ProjectResponse from(Project p){return new ProjectResponse(p.getId(),p.getName(),p.getDescription());}
}
