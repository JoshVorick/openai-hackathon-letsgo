// Theme palettes for light + dark variants are tracked in ref/theme-variants.md
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  GaugeCircle,
  Info,
  Rocket,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfirmDeploymentButton } from "@/components/opportunity/confirm-deployment-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  getOpportunityDetailBySlug,
  type OpportunityDetail,
} from "@/lib/db/queries";
import { opportunityDeploymentStages } from "@/lib/db/schema";

function formatDate(value?: string | Date | null) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return format(date, "EEE, MMM d");
}

function titleCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getFocusMetric(detail: OpportunityDetail) {
  const metadata = detail.opportunity.metadata as Record<string, any> | null;
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const focusMetric = metadata.focusMetric as
    | {
        name?: string;
        current?: number;
        lastYear?: number;
      }
    | undefined;

  if (!focusMetric) {
    return null;
  }
  return focusMetric;
}

function getEventWindow(detail: OpportunityDetail) {
  const metadata = detail.opportunity.metadata as Record<string, any> | null;
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const eventWindow = metadata.eventWindow as
    | {
        start?: string;
        end?: string;
      }
    | undefined;
  const eventName = metadata.eventName as string | undefined;
  const eventVenue = metadata.eventVenue as string | undefined;

  return {
    eventName,
    eventVenue,
    start: eventWindow?.start,
    end: eventWindow?.end,
  };
}

export default async function OpportunityPage({
  params,
}: {
  params: { slug: string };
}) {
  const detail = await getOpportunityDetailBySlug({ slug: params.slug });

  if (!detail) {
    notFound();
  }

  const { opportunity, artifacts, deployments } = detail;
  const primaryArtifact = artifacts[0] ?? null;
  const latestDeployment = deployments[0] ?? null;

  const confidenceValue = opportunity.confidence
    ? Math.round(Number(opportunity.confidence) * 100)
    : null;
  const targetDateLabel = formatDate(opportunity.targetDate);
  const focusMetric = getFocusMetric(detail);
  const eventWindow = getEventWindow(detail);

  const stageOrder = opportunityDeploymentStages;
  const currentStage = latestDeployment?.stage ?? stageOrder[0];
  const currentStageIndex = Math.max(stageOrder.indexOf(currentStage), 0);
  const stageProgress = ((currentStageIndex + 1) / stageOrder.length) * 100;
  const readyToMergeIndex = stageOrder.indexOf("ready_to_merge");
  const confirmDisabled =
    readyToMergeIndex !== -1 && currentStageIndex > readyToMergeIndex;

  const stageTimeline = stageOrder.map((stage, index) => {
    const status =
      index < currentStageIndex
        ? "complete"
        : index === currentStageIndex
          ? "active"
          : "upcoming";

    const description =
      index === currentStageIndex && latestDeployment?.statusMessage
        ? latestDeployment.statusMessage
        : undefined;

    return {
      stage,
      label: titleCase(stage),
      status,
      description,
    };
  });

  return (
    <main className="flex min-h-screen w-full flex-col bg-[#050403] pt-10 pb-16 text-[#F4EDE5] sm:pt-16">
      <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
        <Link
          className="inline-flex items-center gap-2 font-medium text-[#8F7F71] text-sm transition hover:text-[#F4EDE5]"
          href="/"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>

        <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-[#2F241B] bg-[#14100C] p-6 shadow-[0_28px_50px_rgba(0,0,0,0.45)] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Badge
                  className="bg-[#2C1C12] text-[#F3CC9E] uppercase tracking-wide"
                  variant="secondary"
                >
                  {titleCase(opportunity.type)}
                </Badge>
                <Badge
                  className="border-[#3A2A21] text-[#8F7F71] capitalize"
                  variant="outline"
                >
                  {titleCase(opportunity.status)}
                </Badge>
              </div>
              <h1 className="mt-4 font-semibold text-3xl text-[#FDF3E3] leading-tight sm:text-4xl">
                {opportunity.title}
              </h1>
              {opportunity.summary ? (
                <p className="mt-3 max-w-2xl text-[#9B8C80]">
                  {opportunity.summary}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col items-end gap-3 text-right text-[#8F7F71] text-sm">
              {confidenceValue !== null ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-[#1A140F] px-4 py-2 font-medium text-[#F3CC9E]">
                  <GaugeCircle className="size-4" />
                  Confidence {confidenceValue}%
                </div>
              ) : null}
              {targetDateLabel ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-[#1A140F] px-4 py-2 font-medium text-[#F3CC9E]">
                  <CalendarDays className="size-4" />
                  Target: {targetDateLabel}
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-[#32261C] bg-[#18120C]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-semibold text-[#8F7F71] text-sm uppercase tracking-wide">
                  <Info className="size-4" /> Why this matters
                </CardTitle>
              </CardHeader>
              <CardContent className="text-[#B8A695]">
                <p>
                  {opportunity.description ??
                    "Occupancy is pacing below last year and we spotted nearby demand to capture."}
                </p>
              </CardContent>
            </Card>

            <Card className="border-[#32261C] bg-[#18120C]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-semibold text-[#8F7F71] text-sm uppercase tracking-wide">
                  <Rocket className="size-4" /> Opportunity plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-[#B8A695]">
                <p>
                  We'll launch a targeted landing page with a 10% promo code for
                  hackathon attendees, plus campaign copy you can reuse across
                  paid and organic channels.
                </p>
                <p className="text-[#7A6A5C] text-sm">
                  Approving this will open a PR, run checks, and deploy the new
                  page automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="border-[#32261C] bg-[#18120C]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-semibold text-[#8F7F71] text-sm uppercase tracking-wide">
                  <CalendarDays className="size-4" /> Event window
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-[#B8A695]">
                {eventWindow?.eventName ? (
                  <p className="font-medium">{eventWindow.eventName}</p>
                ) : null}
                <p className="text-[#8F7F71] text-sm">
                  {eventWindow?.start ? formatDate(eventWindow.start) : "TBD"} –{" "}
                  {eventWindow?.end ? formatDate(eventWindow.end) : "TBD"}
                </p>
                {eventWindow?.eventVenue ? (
                  <p className="text-[#7A6A5C] text-sm">
                    {eventWindow.eventVenue}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          <section className="flex-1 rounded-3xl border border-[#2F241B] bg-[#14100C] p-6 shadow-[0_28px_50px_rgba(0,0,0,0.45)] sm:p-8">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-[#F5DCC0] text-xl">
                  Preview the landing page
                </h2>
                <p className="text-[#8F7F71] text-sm">
                  Generated draft hosted on Vercel. Tweak copy and layout before
                  deployment.
                </p>
              </div>
              {primaryArtifact?.previewUrl ? (
                <Link
                  className="inline-flex items-center gap-1 font-medium text-[#B8A695] text-sm transition hover:text-[#F5DCC0]"
                  href={primaryArtifact.previewUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  View in new tab
                  <ExternalLink className="size-4" />
                </Link>
              ) : null}
            </header>
            <div className="mt-4 overflow-hidden rounded-2xl border border-[#35281E] bg-[#0E0A07]">
              {primaryArtifact?.previewUrl ? (
                <iframe
                  allow="clipboard-write; encrypted-media; picture-in-picture"
                  className="h-[480px] w-full border-0"
                  src={primaryArtifact.previewUrl}
                  title="Landing page preview"
                />
              ) : (
                <div className="flex h-[320px] items-center justify-center text-[#6F6054]">
                  No preview available yet.
                </div>
              )}
            </div>
          </section>

          <aside className="w-full max-w-lg space-y-6">
            <section className="rounded-3xl border border-[#2F241B] bg-[#14100C] p-6 shadow-[0_28px_50px_rgba(0,0,0,0.45)] sm:p-8">
              <header className="flex items-center justify-between">
                <h2 className="font-semibold text-[#F5DCC0] text-lg">
                  Deployment status
                </h2>
                <span className="font-medium text-[#B8A695] text-sm">
                  {titleCase(currentStage)}
                </span>
              </header>
              <div className="mt-4 space-y-3">
                <Progress className="h-2 bg-[#241A13]" value={stageProgress} />
                <ul className="space-y-2">
                  {stageTimeline.map((step) => (
                    <li
                      className="flex items-start gap-3 rounded-xl bg-[#1B140F] px-3 py-2"
                      key={step.stage}
                    >
                      <div
                        className={`mt-1 size-2 rounded-full ${
                          step.status === "complete"
                            ? "bg-[#34D399]"
                            : step.status === "active"
                              ? "bg-[#F59E0B]"
                              : "bg-[#3C2E24]"
                        }`}
                      />
                      <div>
                        <p className="font-medium text-[#F4EDE5] text-sm">
                          {step.label}
                        </p>
                        {step.description ? (
                          <p className="text-[#8F7F71] text-xs">
                            {step.description}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="rounded-3xl border border-[#2F241B] bg-[#14100C] p-6 shadow-[0_28px_50px_rgba(0,0,0,0.45)] sm:p-8">
              <h2 className="font-semibold text-[#F5DCC0] text-lg">
                Ready to launch?
              </h2>
              <p className="mt-2 text-[#8F7F71] text-sm">
                Approving will create a PR, run automated tests, and deploy the
                landing page once checks pass. You'll see live status updates
                here.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <ConfirmDeploymentButton
                  disabled={confirmDisabled}
                  opportunityId={opportunity.id}
                />
                <p className="text-[#7A6A5C] text-xs">
                  Need changes? Chat with the copilot or leave feedback directly
                  in the draft artifact.
                </p>
              </div>
            </section>

            {focusMetric ? (
              <section className="rounded-3xl border border-[#2F241B] bg-[#14100C] p-6 shadow-[0_28px_50px_rgba(0,0,0,0.45)] sm:p-8">
                <h2 className="font-semibold text-[#F5DCC0] text-lg">
                  Focus metric
                </h2>
                <p className="mt-2 text-[#8F7F71] text-sm">
                  We're prioritising this opportunity because the metric below
                  is underperforming versus last year.
                </p>
                <div className="mt-4 flex items-baseline gap-4 rounded-2xl bg-[#1B140F] px-4 py-5">
                  <div>
                    <p className="font-semibold text-[#8F7F71] text-xs uppercase tracking-wide">
                      Current
                    </p>
                    <p className="font-semibold text-2xl text-[#FDF3E3]">
                      {Math.round((focusMetric.current ?? 0) * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#8F7F71] text-xs uppercase tracking-wide">
                      Last year
                    </p>
                    <p className="font-semibold text-2xl text-[#B8A695]">
                      {Math.round((focusMetric.lastYear ?? 0) * 100)}%
                    </p>
                  </div>
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
