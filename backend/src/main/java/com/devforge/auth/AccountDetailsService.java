package com.devforge.auth;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AccountDetailsService implements UserDetailsService {
	private final AccountRepository accounts;

	public AccountDetailsService(AccountRepository accounts) { this.accounts = accounts; }

	@Override
	public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
		Account account = accounts.findByEmail(email.trim().toLowerCase())
				.orElseThrow(() -> new UsernameNotFoundException("Account not found"));
		return User.withUsername(account.getEmail()).password(account.getPasswordHash()).roles("USER").build();
	}
}
