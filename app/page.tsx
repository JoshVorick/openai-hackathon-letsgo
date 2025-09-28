// Theme palettes for light + dark variants are tracked in ref/theme-variants.md
"use client";
import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { MetricCarousel } from "@/components/dashboard/metric-carousel";
import { TodoList } from "@/components/dashboard/todo-list";
import { BellhopMark } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { getMockHotelSnapshot } from "@/lib/demo/mock-hotel";

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
});

function getGreeting(date: Date) {
  const hour = date.getHours();
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 17) {
    return "Good afternoon";
  }
  return "Good evening";
}

function getBarColor(value: number) {
  if (value < 40) {
    return "#FF6848";
  }
  if (value < 60) {
    return "#FF9B4C";
  }
  if (value < 75) {
    return "#FFC87A";
  }
  return "#8BD37D";
}

const opportunityDetailRoutes: Record<string, string> = {
  "hackathon-marketing": "/opportunities/hackathon-event",
};

export default function DashboardPage() {
  const snapshot = getMockHotelSnapshot();
  const greeting = getGreeting(new Date());
  const actionsCount = snapshot.opportunities.length;

  const handleBellhopKickoff = (detail: { prompt: string; source: string }) => {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("bellhop:kickoff", {
        detail,
      })
    );
  };

  return (
    <main className="min-h-screen bg-[#050403] text-[#F4EDE5]">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-3 pt-10 pb-28 sm:px-4">
        <header className="flex justify-start">
          <BellhopMark className="h-6 w-6 text-[#F4EDE5]" />
        </header>

        <section className="mt-10">
          <p className="font-medium text-[#8F7F71] text-sm">{greeting},</p>
          <h1 className="mt-1 font-semibold text-3xl text-[#FBF2E4]">
            {snapshot.name}
          </h1>
        </section>

        <details className="group mt-8 rounded-[32px] border border-[#32271F] bg-gradient-to-b from-[#19130E] to-[#0F0C09] px-5 py-4 shadow-[0_26px_44px_rgba(0,0,0,0.45)]">
          <summary className="flex cursor-pointer list-none items-center gap-4 outline-none [&::-webkit-details-marker]:hidden">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF4E28] text-white shadow-[0_18px_30px_rgba(255,78,40,0.35)]">
              <span className="font-mono font-semibold text-sm">
                {String(actionsCount).padStart(2, "0")}
              </span>
            </span>
            <span className="flex-1 font-semibold text-[#F4EDE5] text-lg">
              Actions to take
            </span>
            <ChevronDown className="size-5 text-[#F4EDE5] transition group-open:rotate-180" />
          </summary>

          <div className="mt-4 space-y-3">
            {snapshot.opportunities.map((opportunity) => {
              const detailHref =
                opportunityDetailRoutes[opportunity.id] ??
                `/opportunities/${opportunity.id}`;
              const isDetailOpportunity =
                opportunity.id === "hackathon-marketing";

              return (
                <article
                  className="rounded-3xl border border-[#2E241C] bg-[#14100C]/90 px-4 py-5 shadow-[0_18px_32px_rgba(0,0,0,0.45)]"
                  key={opportunity.id}
                >
                  <h2 className="font-semibold text-[#F9EBD9] text-base">
                    {opportunity.title}
                  </h2>
                  <p className="mt-2 text-[#A59281] text-sm">
                    {opportunity.description}
                  </p>
                  <div className="mt-5 flex flex-col gap-3">
                    {isDetailOpportunity ? (
                      <Button
                        asChild
                        className="w-full justify-between bg-[#FF922C] text-[#1D1107] shadow-[0_16px_30px_rgba(255,146,44,0.45)] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF922C]/50"
                      >
                        <Link href={detailHref}>
                          <span>{opportunity.llmActionLabel}</span>
                          <ArrowUpRight className="size-4" />
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        className="w-full justify-between bg-[#FF922C] text-[#1D1107] shadow-[0_16px_30px_rgba(255,146,44,0.45)] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF922C]/50"
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
                    )}
                    <Link
                      className="inline-flex w-full items-center justify-between gap-2 rounded-full border border-[#8F7F71] px-5 py-2 font-semibold text-[#F4EDE5] text-sm transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F7F71]/50"
                      href={detailHref}
                    >
                      <span>{opportunity.ctaLabel}</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </details>

        <MetricCarousel
          className="mt-8"
          slides={[
            <div className="space-y-6" key="occupancy">
              <h2 className="text-center font-medium text-[#8F7F71] text-sm">
                Next week's occupancy
              </h2>
              <div className="mt-5 flex items-end justify-between gap-2 rounded-[30px] border border-[#2F241C] bg-[#110D0A] px-5 py-6 shadow-[0_26px_48px_rgba(0,0,0,0.45)]">
                {snapshot.occupancy.map((point, index) => {
                  const current = Math.max(0, Math.min(point.occupancy, 100));
                  const lastYearValue = Math.max(
                    0,
                    Math.min(point.lastYearOccupancy, 100)
                  );
                  const today = new Date();
                  const labelDate = new Date(today);
                  labelDate.setDate(today.getDate() + index);
                  return (
                    <div
                      className="flex flex-col items-center gap-2"
                      key={point.date}
                    >
                      <div className="relative flex h-32 w-6 items-end justify-center">
                        <span
                          aria-hidden
                          className="absolute bottom-0 w-full rounded-full bg-[#362A22]"
                          style={{ height: `${lastYearValue}%`, opacity: 0.55 }}
                        />
                        <span
                          className="relative z-10 block w-[70%] rounded-full"
                          style={{
                            height: `${current}%`,
                            maxHeight: "100%",
                            backgroundColor: getBarColor(current),
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          }}
                        />
                      </div>
                      <div className="flex flex-col items-center leading-none">
                        <span className="font-semibold text-[#F7E8D8] text-xs">
                          {Math.round(current)}%
                        </span>
                        <span className="text-[#8B7B6D] text-[10px]">
                          LY {Math.round(lastYearValue)}%
                        </span>
                      </div>
                      <span className="mt-1 font-medium text-[#8B7B6D] text-xs">
                        {weekdayFormatter.format(labelDate)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>,
          ]}
        />

        <TodoList />
      </div>
    </main>
  );
}
