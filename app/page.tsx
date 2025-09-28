"use client";

import { ArrowUpRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { MetricCarousel } from "@/components/dashboard/metric-carousel";
import { TodoList } from "@/components/dashboard/todo-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getMockHotelSnapshot } from "@/lib/demo/mock-hotel";
import { cn } from "@/lib/utils";

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
});

const impactLabels: Record<string, string> = {
  "weekend-clamp-adjustment": "Revenue lift",
  "hackathon-marketing": "High impact",
};

export default function DashboardPage() {
  const snapshot = getMockHotelSnapshot();
  const [actionsOpen, setActionsOpen] = useState(false);
  const opportunitiesCount = snapshot.opportunities.length;

  const revenueMixData = [
    { segment: "Direct leisure", share: 42, adr: 318, delta: 14 },
    { segment: "Corporate", share: 31, adr: 276, delta: 9 },
    { segment: "Groups & events", share: 19, adr: 292, delta: -3 },
    { segment: "OTA", share: 8, adr: 255, delta: -6 },
  ];

  const opsPulse = [
    {
      label: "Housekeeping turns",
      status: "On track",
      note: "27 rooms remaining",
      tone: "ok" as const,
    },
    {
      label: "Front desk staffing",
      status: "Add evening shift",
      note: "+1 agent Fri 4pm-10pm",
      tone: "warn" as const,
    },
    {
      label: "Guest sentiment",
      status: "Watch construction mentions",
      note: "3 reviews past 48h",
      tone: "warn" as const,
    },
  ];

  const handleBellhopKickoff = (detail: { prompt: string; source: string }) => {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("bellhop:kickoff", {
        detail,
      }),
    );
  };

  return (
    <main className="relative flex min-h-screen flex-col bg-neutral-950 text-neutral-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="-left-24 absolute top-8 h-72 w-72 rounded-full bg-rose-500/30 blur-3xl" />
        <div className="-right-24 absolute top-56 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent via-neutral-950/40 to-neutral-950" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl flex-col gap-12 px-6 pt-16 pb-20 sm:px-10 lg:max-w-6xl xl:max-w-7xl">
        <header className="flex flex-col gap-6">
          <div className="text-neutral-300 text-sm">
            <span className="rounded-full border border-white/10 px-3 py-1 text-neutral-400 text-xs uppercase tracking-widest">
              {snapshot.address}
            </span>
          </div>
          <div>
            <h1 className="mb-4 font-semibold text-4xl text-white leading-tight sm:text-5xl lg:text-6xl">
              {snapshot.name}
            </h1>
          </div>
        </header>

        <section
          className={cn(
            "relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/8 via-white/6 to-white/10 ring-1 ring-white/10 backdrop-blur-xl"
          )}
          id="opportunities"
        >
          <button
            aria-controls="opportunities-panel"
            aria-expanded={actionsOpen}
            className="relative flex w-full cursor-pointer items-center gap-5 px-3 py-4 text-left text-neutral-50 focus:outline-none sm:px-8 sm:py-7"
            onClick={() => setActionsOpen((prev) => !prev)}
            type="button"
          >
            <div className="relative h-16 w-16 flex-shrink-0 sm:h-20 sm:w-20">
              <div className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-red-300 via-red-400 to-red-500 font-semibold text-white text-xl shadow-[0_20px_35px_-20px_rgba(244,114,182,0.65)]">
                <span className="drop-shadow-md">
                  {String(opportunitiesCount).padStart(2, "0")}
                </span>
              </div>
              <div className="absolute inset-0 rounded-full border border-white/30" />
            </div>
            <div className="flex flex-1 items-center justify-between gap-6">
              <div className="flex flex-col">
                <h2 className="mt-2 font-semibold text-2xl text-neutral-50">
                  Actions to take
                </h2>
              </div>
              <ChevronDown
                className={`flex-shrink-0 text-neutral-200 transition-transform duration-300 ${actionsOpen ? "rotate-180" : "rotate-0"}`}
                size={36}
              />
            </div>
          </button>

          <div
            aria-hidden={!actionsOpen}
            className={`overflow-hidden transition-all duration-500 ${
              actionsOpen ? "max-h-[1200px] lg:max-h-[900px]" : "max-h-0"
            }`}
            id="opportunities-panel"
          >
            <div
              className={`px-6 pt-0 pb-6 transition-opacity duration-400 sm:px-8 ${
                actionsOpen ? "opacity-100 delay-75" : "opacity-0"
              }`}
            >
              <div
                className={`grid gap-5 ${actionsOpen ? "lg:grid-cols-2" : ""}`}
              >
                {snapshot.opportunities.map((opportunity, index) => {
                  const accent =
                    opportunity.type === "event"
                      ? "bg-rose-500/20 text-rose-200"
                      : opportunity.type === "pricing"
                        ? "bg-emerald-500/15 text-emerald-200"
                        : "bg-sky-500/15 text-sky-100";

                  return (
                    <Card
                      className="group border-white/10 bg-white/5 transition hover:border-rose-400/40 hover:bg-white/10"
                      key={opportunity.id}
                    >
                      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-0">
                        <div className="flex items-center gap-3 font-medium text-neutral-400 text-xs uppercase tracking-wide">
                          <span className="rounded-full border border-white/10 px-2 py-1 text-neutral-500">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 font-semibold text-[0.65rem] ${accent}`}
                          >
                            {opportunity.type}
                          </span>
                        </div>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-neutral-400 text-xs">
                          {impactLabels[opportunity.id] ?? "Operational"}
                        </span>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <h3 className="font-semibold text-neutral-50 text-xl">
                          {opportunity.title}
                        </h3>
                        <p className="mt-3 text-neutral-300 text-sm leading-relaxed">
                          {opportunity.description}
                        </p>
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-neutral-400 text-xs">
                          <span className="inline-flex items-center gap-2">
                            <span className="size-2 rounded-full bg-emerald-400" />
                            Ready for review
                          </span>
                          <span>ETA: instant deploy</span>
                        </div>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                          <Button
                            className="flex-1 justify-between bg-white text-neutral-900 shadow-sm transition group-hover:bg-neutral-900 group-hover:text-white"
                            onClick={() =>
                              handleBellhopKickoff({
                                prompt: opportunity.llmKickoffPrompt,
                                source: opportunity.id,
                              })
                            }
                            type="button"
                          >
                            <span>{opportunity.llmActionLabel}</span>
                            <ArrowUpRight className="size-4" />
                          </Button>
                          <Button
                            asChild
                            className="flex-1 justify-between border border-white/10 bg-transparent text-white transition hover:border-white/30"
                            variant="secondary"
                          >
                            <Link href={`/opportunities/${opportunity.id}`}>
                              <span>{opportunity.ctaLabel}</span>
                              <ArrowUpRight className="size-4" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <div
                className={`mt-6 flex items-center justify-end transition-opacity duration-300 ${
                  actionsOpen ? "opacity-100" : "opacity-0"
                }`}
              >
                <Button
                  className="bg-white/10 text-neutral-200 hover:bg-white/20"
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  Refresh pipeline
                </Button>
              </div>
            </div>
          </div>
        </section>

        <MetricCarousel
          className="mt-4"
          slides={[
            <div className="space-y-6" key="occupancy">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-xs uppercase tracking-widest">
                    Outlook
                  </p>
                  <h2 className="mt-1 font-semibold text-neutral-50 text-xl">
                    Occupancy pacing vs last year
                  </h2>
                </div>
                <span className="font-medium text-neutral-400 text-xs">
                  Forecast vs LY
                </span>
              </div>
              <div className="grid grid-cols-7 gap-3">
                {snapshot.occupancy.map((point) => {
                  const date = new Date(point.date);
                  const occupancy = point.occupancy;
                  const lastYear = point.lastYearOccupancy;
                  const delta = occupancy - lastYear;

                  return (
                    <div
                      className="flex flex-col items-center gap-2"
                      key={point.date}
                    >
                      <div className="flex h-32 w-8 items-end justify-center gap-[5px] rounded-full bg-white/5 p-1">
                        <div
                          className="w-2 rounded-full bg-rose-500"
                          style={{
                            height: `${occupancy}%`,
                            maxHeight: "100%",
                          }}
                        />
                        <div
                          className="w-2 rounded-full bg-neutral-700"
                          style={{
                            height: `${lastYear}%`,
                            maxHeight: "100%",
                          }}
                        />
                      </div>
                      <span
                        className={`font-semibold text-[0.65rem] ${
                          delta >= 0 ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        {delta >= 0 ? "+" : ""}
                        {delta.toFixed(1)}%
                      </span>
                      <span className="font-medium text-neutral-400 text-xs uppercase tracking-wide">
                        {weekdayFormatter.format(date)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-neutral-400 text-xs">
                Rose bars represent the current forecast. Slate bars show the
                same night last year.
              </p>
            </div>,
            <div className="space-y-5" key="room-mix">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-neutral-400 text-xs uppercase tracking-widest">
                    Revenue mix outlook
                  </p>
                  <h2 className="mt-1 font-semibold text-neutral-50 text-xl">
                    Segment share & ADR variance
                  </h2>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-neutral-300 text-xs">
                  ADR change vs LY
                </span>
              </div>
              <div className="grid gap-3">
                {revenueMixData.map((row) => (
                  <div
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-neutral-200 text-sm"
                    key={row.segment}
                  >
                    <div>
                      <p className="font-semibold text-neutral-50">
                        {row.segment}
                      </p>
                      <p className="text-neutral-400 text-xs uppercase tracking-wide">
                        {row.share}% of bookings
                      </p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-lg text-neutral-50">
                        ${row.adr}
                      </span>
                      <span
                        className={`font-semibold text-xs ${
                          row.delta >= 0 ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        {row.delta >= 0 ? "+" : ""}
                        {row.delta}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>,
            <div className="space-y-5" key="staffing">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-neutral-400 text-xs uppercase tracking-widest">
                    Operations radar
                  </p>
                  <h2 className="mt-1 font-semibold text-neutral-50 text-xl">
                    Live readiness checklist
                  </h2>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-neutral-300 text-xs">
                  Updated 5 min ago
                </span>
              </div>
              <div className="grid gap-3">
                {opsPulse.map((item) => (
                  <div
                    className={`flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm ${
                      item.tone === "ok"
                        ? "bg-emerald-500/10 text-emerald-100"
                        : "bg-amber-500/10 text-amber-100"
                    }`}
                    key={item.label}
                  >
                    <div>
                      <p className="font-semibold">{item.label}</p>
                      <p className="text-white/70 text-xs">{item.note}</p>
                    </div>
                    <span className="text-xs uppercase tracking-wide">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>,
          ]}
        />

        <TodoList />
      </div>
    </main>
  );
}
