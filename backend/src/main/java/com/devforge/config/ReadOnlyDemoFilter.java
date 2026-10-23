package com.devforge.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class ReadOnlyDemoFilter extends OncePerRequestFilter {

	private final boolean readOnly;

	public ReadOnlyDemoFilter(@Value("${devforge.demo.read-only:false}") boolean readOnly) {
		this.readOnly = readOnly;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		String method = request.getMethod();
		boolean mutation = method.equals("POST") || method.equals("PUT") || method.equals("PATCH")
				|| method.equals("DELETE");

		if (readOnly && mutation && request.getRequestURI().startsWith(request.getContextPath() + "/api/")) {
			response.sendError(HttpServletResponse.SC_FORBIDDEN, "The public demo is read-only.");
			return;
		}

		chain.doFilter(request, response);
	}
}
