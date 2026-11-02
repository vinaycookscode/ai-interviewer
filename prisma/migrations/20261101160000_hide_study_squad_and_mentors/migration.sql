-- Study Squad and Mentors are hidden until they work end to end (AIIN-75). A missing flag counts as on,
-- so the rows are written, and turned off if they already exist.
INSERT INTO "FeatureFlag" ("key", "enabled", "description", "category", "updatedAt") VALUES
    ('study_squad', false, 'Study groups (hidden until members can work together)', 'CANDIDATE', CURRENT_TIMESTAMP),
    ('mentor_matching', false, 'Mentor directory (hidden until mentors are verified and can talk to mentees)', 'CANDIDATE', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET "enabled" = false, "updatedAt" = CURRENT_TIMESTAMP;
