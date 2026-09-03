package com.acme.assetmanagement.config;

import com.acme.assetmanagement.user.Permission;
import com.acme.assetmanagement.user.UserAccount;
import com.acme.assetmanagement.user.UserRepository;
import com.acme.assetmanagement.user.UserRole;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class UserInitializer implements CommandLineRunner {
    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String password;

    public UserInitializer(UserRepository repository, PasswordEncoder passwordEncoder,
                           @Value("${asset.admin.username:admin}") String username,
                           @Value("${asset.admin.password:ChangeMe123!}") String password) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.username = username;
        this.password = password;
    }

    @Override
    public void run(String... args) {
        if (repository.existsByRole(UserRole.SUPER_ADMIN)) return;
        UserAccount admin = new UserAccount();
        admin.setUsername(username.trim());
        admin.setDisplayName(username.trim());
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setRole(UserRole.SUPER_ADMIN);
        admin.setPermissions(Set.of(Permission.values()));
        admin.setEnabled(true);
        repository.save(admin);
    }
}
