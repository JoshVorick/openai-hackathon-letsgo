"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Play,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createOpportunityPreviewHtml,
  type LandingDefaults,
} from "@/components/opportunity/opportunity-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

export type StageStep = {
  stage: string;
  label: string;
  status: "complete" | "active" | "upcoming";
  description?: string;
};

type OpportunityWorkspaceProps = {
  stageTimeline: StageStep[];
  stageProgress: number;
  currentStageLabel: string;
  confirmDisabled: boolean;
  opportunityId: string;
  landingDefaults: LandingDefaults;
};

export function OpportunityWorkspace({
  stageTimeline,
  stageProgress,
  currentStageLabel,
  confirmDisabled,
  opportunityId,
  landingDefaults,
}: OpportunityWorkspaceProps) {
  const deriveDefaults = useCallback(() => landingDefaults, [landingDefaults]);
  const defaultValues = deriveDefaults();
  const [formValues, setFormValues] = useState(defaultValues);
  const [savedValues, setSavedValues] = useState(defaultValues);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const [deployState, setDeployState] = useState<
    "idle" | "deploying" | "success"
  >("idle");
  const [deployMessage, setDeployMessage] = useState(
    "Ready to deploy your landing page."
  );
  const [deployProgress, setDeployProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      for (const timeout of timeoutsRef.current) {
        clearTimeout(timeout);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (savedIndicatorTimeoutRef.current) {
        clearTimeout(savedIndicatorTimeoutRef.current);
      }
    };
  }, []);

  const previewHtml = useMemo(
    () => createOpportunityPreviewHtml(savedValues),
    [savedValues]
  );

  const previewSrcDoc = previewHtml;

  const previewPath = useMemo(() => {
    const params = new URLSearchParams({
      slug: savedValues.slug,
      title: savedValues.title,
      body: savedValues.body,
    });
    return `/preview/opportunity?${params.toString()}`;
  }, [savedValues]);

  const [resolvedPreviewUrl, setResolvedPreviewUrl] = useState(previewPath);

  useEffect(() => {
    if (typeof window === "undefined") {
      setResolvedPreviewUrl(previewPath);
      return;
    }
    const absoluteUrl = new URL(previewPath, window.location.origin).toString();
    setResolvedPreviewUrl(absoluteUrl);
  }, [previewPath]);

  const dataHref = useMemo(
    () => `data:text/html;charset=utf-8,${encodeURIComponent(previewHtml)}`,
    [previewHtml]
  );

  const handleFieldChange = useCallback(
    (key: keyof LandingDefaults, value: string) => {
      setFormValues((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleSave = useCallback(() => {
    if (isSaving) {
      return;
    }
    setIsSaving(true);
    setJustSaved(false);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      setSavedValues(formValues);
      setIsSaving(false);
      setJustSaved(true);
      if (savedIndicatorTimeoutRef.current) {
        clearTimeout(savedIndicatorTimeoutRef.current);
      }
      savedIndicatorTimeoutRef.current = setTimeout(() => {
        setJustSaved(false);
      }, 2000);
    }, 750);
  }, [formValues, isSaving]);

  const handleDeploy = useCallback(() => {
    if (confirmDisabled || deployState !== "idle") {
      return;
    }

    setDeployState("deploying");
    setDeployProgress(12);
    setDeployMessage("Opening deployment pull request…");

    const steps = [
      { delay: 1300, progress: 38, message: "Running automated checks…" },
      { delay: 2600, progress: 68, message: "Provisioning Vercel preview…" },
      { delay: 3900, progress: 88, message: "Finalising rollout…" },
      {
        delay: 5200,
        progress: 100,
        message: "Landing page deployed successfully!",
        complete: true,
      },
    ];

    for (const step of steps) {
      const timeout = setTimeout(() => {
        setDeployProgress(step.progress);
        setDeployMessage(step.message);
        if (step.complete) {
          setDeployState("success");
        }
      }, step.delay);
      timeoutsRef.current.push(timeout);
    }
  }, [confirmDisabled, deployState]);

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(resolvedPreviewUrl);
      setCopied(true);
      const timeout = setTimeout(() => setCopied(false), 1800);
      timeoutsRef.current.push(timeout);
    } catch (error) {
      console.error("Failed to copy URL", error);
    }
  }, [resolvedPreviewUrl]);

  const handleStartCampaign = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    const prompt = `A new landing page is live at ${resolvedPreviewUrl}. Draft a marketing campaign brief targeting GPT-5 Codex attendees with copy variations and channel recommendations.`;
    window.dispatchEvent(
      new CustomEvent("bellhop:kickoff", {
        detail: {
          prompt,
          source: `${opportunityId}-campaign`,
        },
      })
    );
  }, [opportunityId, resolvedPreviewUrl]);

  return (
    <div className="mt-6 flex flex-col gap-6 lg:flex-row">
      <section className="flex-1 rounded-3xl border border-[#2F241B] bg-[#14100C] p-6 shadow-[0_28px_50px_rgba(0,0,0,0.45)] sm:p-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-[#F5DCC0] text-xl">
              Preview the landing page
            </h2>
            <p className="text-[#8F7F71] text-sm">
              Edit the metadata below and save to update the preview instantly.
            </p>
          </div>
          <a
            className="inline-flex items-center gap-1 font-medium text-[#B8A695] text-sm transition hover:text-[#F5DCC0]"
            href={dataHref}
            rel="noopener noreferrer"
            target="_blank"
          >
            View in new tab
            <ExternalLink className="size-4" />
          </a>
        </header>

        <div className="mt-5 grid gap-4 rounded-2xl border border-[#2F241C] bg-[#1A140F] p-4 sm:p-5">
          <div className="grid gap-2">
            <Label className="text-[#9F8A79] text-xs uppercase tracking-wide">
              URL slug
            </Label>
            <Input
              className="border-[#3A2A21] bg-[#0F0A07] text-[#F4EDE5] placeholder:text-[#6F6054]"
              onChange={(event) =>
                handleFieldChange("slug", event.target.value.trim())
              }
              value={formValues.slug}
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-[#9F8A79] text-xs uppercase tracking-wide">
              Title
            </Label>
            <Input
              className="border-[#3A2A21] bg-[#0F0A07] text-[#F4EDE5] placeholder:text-[#6F6054]"
              onChange={(event) =>
                handleFieldChange("title", event.target.value)
              }
              value={formValues.title}
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-[#9F8A79] text-xs uppercase tracking-wide">
              Body copy
            </Label>
            <Textarea
              className="min-h-[140px] border-[#3A2A21] bg-[#0F0A07] text-[#F4EDE5] placeholder:text-[#6F6054]"
              onChange={(event) =>
                handleFieldChange("body", event.target.value)
              }
              value={formValues.body}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="inline-flex items-center gap-2 rounded-full bg-[#FF922C] px-5 py-2.5 text-[#1D1107] shadow-[0_16px_30px_rgba(255,146,44,0.25)] transition hover:scale-105"
              onClick={handleSave}
              type="button"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  <span>Save changes</span>
                </>
              )}
            </Button>
            {justSaved ? (
              <span className="text-[#7A6A5C] text-sm">
                Draft updated · preview refreshed
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-[#35281E] bg-[#0E0A07]">
          <iframe
            allow="clipboard-write; encrypted-media; picture-in-picture"
            className="h-[480px] w-full border-0"
            srcDoc={previewSrcDoc}
            title="Landing page preview"
          />
        </div>
      </section>

      <aside className="w-full max-w-lg space-y-6">
        <section className="rounded-3xl border border-[#2F241B] bg-[#14100C] p-6 shadow-[0_28px_50px_rgba(0,0,0,0.45)] sm:p-8">
          <header className="flex items-center justify-between">
            <h2 className="font-semibold text-[#F5DCC0] text-lg">
              Deployment status
            </h2>
            <span className="font-medium text-[#B8A695] text-sm">
              {currentStageLabel}
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
          {deployState !== "success" ? (
            <>
              <h2 className="font-semibold text-[#F5DCC0] text-lg">
                Ready to launch?
              </h2>
              <p className="mt-2 text-[#8F7F71] text-sm">
                Approving will create a PR, run automated checks, and deploy the{" "}
                landing page once everything passes.
              </p>
              <div className="mt-4 space-y-3">
                <Button
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FF922C] py-3 font-semibold text-[#1D1107] text-base shadow-[0_18px_32px_rgba(255,146,44,0.35)] transition hover:scale-105 disabled:opacity-60"
                  disabled={confirmDisabled || deployState === "deploying"}
                  onClick={handleDeploy}
                  type="button"
                >
                  {deployState === "deploying" ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      <span>Deploying landing page…</span>
                    </>
                  ) : (
                    <>
                      <Play className="size-5" />
                      <span>Approve & deploy</span>
                    </>
                  )}
                </Button>
                <div className="rounded-2xl border border-[#30241B] bg-[#1B140F] px-4 py-3 text-[#9F8A79] text-sm">
                  <p>{deployMessage}</p>
                  {deployState === "deploying" ? (
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#241A13]">
                      <div
                        className="h-full rounded-full bg-[#FF922C] transition-all"
                        style={{ width: `${deployProgress}%` }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#1A140F] px-4 py-2 text-[#F3CC9E]">
                <CheckCircle2 className="size-5 text-[#FF922C]" />
                Deployment complete
              </div>
              <div>
                <h2 className="font-semibold text-[#F5DCC0] text-lg">
                  Landing page is live
                </h2>
                <p className="mt-2 text-[#8F7F71] text-sm">
                  Share the launch with your team or kick off promotions right
                  from here.
                </p>
              </div>
              <div className="grid gap-3">
                <Button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#FF922C] py-3 font-semibold text-[#1D1107] text-base shadow-[0_18px_32px_rgba(255,146,44,0.35)] transition hover:scale-105"
                  onClick={handleStartCampaign}
                  type="button"
                >
                  <ArrowUpRight className="size-5" />
                  Start a marketing campaign for this page
                </Button>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#3C2E24] py-2.5 text-[#F4EDE5] transition hover:bg-[#1F1711]"
                    onClick={handleCopyUrl}
                    type="button"
                  >
                    <Copy className="size-4" />
                    {copied ? "Copied" : "Copy URL"}
                  </Button>
                  <Button
                    asChild
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#3C2E24] py-2.5 text-[#F4EDE5] transition hover:bg-[#1F1711]"
                    type="button"
                  >
                    <Link href={previewPath} rel="noreferrer" target="_blank">
                      <ExternalLink className="size-4" />
                      Visit page
                    </Link>
                  </Button>
                </div>
                <p className="text-[#7A6A5C] text-xs">
                  URL published to{" "}
                  <span className="break-all font-medium">
                    {resolvedPreviewUrl}
                  </span>
                </p>
              </div>
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
