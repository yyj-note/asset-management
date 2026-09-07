package com.acme.assetmanagement.security;

import com.acme.assetmanagement.user.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class AccountSessionFilter extends OncePerRequestFilter {
    private final UserRepository repository;

    public AccountSessionFilter(UserRepository repository) {
        this.repository = repository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AccountPrincipal principal
                && !repository.existsByIdAndEnabledTrueAndPasswordHashAndRole(
                        principal.id(), principal.password(), principal.role())) {
            // Recheck committed account state so deleted accounts and old credentials cannot keep using a session.
            SecurityContextHolder.clearContext();
            var session = request.getSession(false);
            if (session != null) session.invalidate();
        }
        filterChain.doFilter(request, response);
    }
}
