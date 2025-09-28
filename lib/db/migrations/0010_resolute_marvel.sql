CREATE TABLE IF NOT EXISTS "Opportunities" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "slug" varchar(128) NOT NULL,
    "title" text NOT NULL,
    "summary" text,
    "description" text,
    "type" varchar NOT NULL,
    "status" varchar NOT NULL DEFAULT 'draft',
    "confidence" numeric(4, 2),
    "targetDate" date,
    "ctaLabel" varchar(128),
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Opportunities_slug_unique" ON "Opportunities" ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Opportunities_type_idx" ON "Opportunities" ("type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Opportunities_status_idx" ON "Opportunities" ("status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "OpportunityArtifacts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "opportunityId" uuid NOT NULL,
    "type" varchar NOT NULL,
    "title" text,
    "description" text,
    "content" jsonb,
    "previewUrl" text,
    "externalUrl" text,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "OpportunityArtifacts_opportunity_idx" ON "OpportunityArtifacts" ("opportunityId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "OpportunityArtifacts_type_idx" ON "OpportunityArtifacts" ("type");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "OpportunityArtifacts_opportunity_type_unique" ON "OpportunityArtifacts" ("opportunityId", "type");
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "OpportunityArtifacts"
        ADD CONSTRAINT "OpportunityArtifacts_opportunityId_Opportunities_id_fk"
        FOREIGN KEY ("opportunityId")
        REFERENCES "public"."Opportunities"("id")
        ON DELETE cascade
        ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "OpportunityDeployments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "opportunityId" uuid NOT NULL,
    "artifactId" uuid,
    "stage" varchar NOT NULL DEFAULT 'draft',
    "githubRepo" varchar(255),
    "githubBranch" varchar(255),
    "githubPrNumber" integer,
    "githubPrUrl" text,
    "commitSha" varchar(64),
    "checksStatus" varchar DEFAULT 'pending',
    "checksUrl" text,
    "vercelProject" varchar(255),
    "vercelDeploymentUrl" text,
    "vercelPreviewUrl" text,
    "statusMessage" text,
    "startedAt" timestamp,
    "completedAt" timestamp,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "OpportunityDeployments_opportunity_idx" ON "OpportunityDeployments" ("opportunityId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "OpportunityDeployments_stage_idx" ON "OpportunityDeployments" ("stage");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "OpportunityDeployments_artifact_idx" ON "OpportunityDeployments" ("artifactId");
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "OpportunityDeployments"
        ADD CONSTRAINT "OpportunityDeployments_opportunityId_Opportunities_id_fk"
        FOREIGN KEY ("opportunityId")
        REFERENCES "public"."Opportunities"("id")
        ON DELETE cascade
        ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "OpportunityDeployments"
        ADD CONSTRAINT "OpportunityDeployments_artifactId_OpportunityArtifacts_id_fk"
        FOREIGN KEY ("artifactId")
        REFERENCES "public"."OpportunityArtifacts"("id")
        ON DELETE set null
        ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
