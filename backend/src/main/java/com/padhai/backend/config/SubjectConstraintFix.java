package com.padhai.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

// @Component = Spring creates this at startup.
// CommandLineRunner = Spring calls run() once, AFTER the app has started
// (after Hibernate has updated the tables).
@Component
public class SubjectConstraintFix implements CommandLineRunner {

    // Writes messages to the IntelliJ console / Render logs
    private static final Logger log = LoggerFactory.getLogger(SubjectConstraintFix.class);
    // Spring's helper for running plain SQL
    private final JdbcTemplate jdbc;

    public SubjectConstraintFix(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        try {
            // """ ... """ = Java text block, lets SQL span many lines.
            // The SQL finds any UNIQUE rule on ONLY the "name" column of "subjects"
            // and deletes it. After the first run nothing matches, so later
            // startups do nothing. Safe to leave this file in.
            jdbc.execute("""
                DO $$
                DECLARE c text;
                BEGIN
                  FOR c IN
                    SELECT con.conname FROM pg_constraint con
                    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
                    WHERE con.conrelid = 'subjects'::regclass
                      AND con.contype = 'u'
                      AND array_length(con.conkey, 1) = 1
                      AND att.attname = 'name'
                  LOOP
                    EXECUTE 'ALTER TABLE subjects DROP CONSTRAINT ' || quote_ident(c);
                  END LOOP;
                END $$;
                """);
        } catch (Exception e) {
            // If anything goes wrong, just log a warning; the app keeps running
            log.warn("Could not check old subjects.name unique constraint: {}", e.getMessage());
        }
    }
}