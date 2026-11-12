-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "inviteExpiresAt" TIMESTAMP(3),
ADD COLUMN     "inviteMessage" TEXT,
ADD COLUMN     "invitedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "talentInvitesPerMonth" INTEGER NOT NULL DEFAULT 10;

-- Starting allowances (AIIN-204): Free 10, Pro 50, Premium 200 invitations a month; admins can change them
UPDATE "SubscriptionPlan" SET "talentInvitesPerMonth" = 50 WHERE "tier" = 'PRO';
UPDATE "SubscriptionPlan" SET "talentInvitesPerMonth" = 200 WHERE "tier" = 'PREMIUM';
