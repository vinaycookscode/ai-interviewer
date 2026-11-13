-- Email verification starts with AIIN-55. Accounts made before it are treated as verified, so nobody who already uses
-- the app is suddenly blocked from practising. New sign-ups verify by email.
UPDATE "User" SET "emailVerified" = CURRENT_TIMESTAMP WHERE "emailVerified" IS NULL;
