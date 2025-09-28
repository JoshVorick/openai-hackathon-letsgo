// Theme palettes for light + dark variants are tracked in ref/theme-variants.md
import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { CompetitorPricingChart } from "@/components/dashboard/competitor-pricing-chart";
import { MetricCarousel } from "@/components/dashboard/metric-carousel";
import { TodoList } from "@/components/dashboard/todo-list";
import { BellhopMark } from "@/components/icons";
import { getMockHotelSnapshot } from "@/lib/demo/mock-hotel";

type OccupancyDisplay = {
  date: string;
  occupancy: number;
  lastYearOccupancy: number | null;
};

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
});

function formatISODate(date: Date) {
  return date.toISOString().split("T")[0];
}

function computeNextWeekRange() {
  const today = new Date();
  const start = new Date(today);
  const daysUntilNextMonday = (8 - start.getDay()) % 7 || 7;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + daysUntilNextMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start,
    end,
    startISO: formatISODate(start),
    endISO: formatISODate(end),
  };
}

async function fetchWeeklyOccupancy(
  range: ReturnType<typeof computeNextWeekRange>,
  fallback: OccupancyDisplay[]
): Promise<OccupancyDisplay[]> {
  if (!process.env.POSTGRES_URL) {
    return fallback;
  }

  try {
    const { getOccupancyData } = await import(
      "@/lib/ai/tools/get-occupancy-data"
    );

    if (!getOccupancyData || typeof getOccupancyData.execute !== "function") {
      return fallback;
    }

    const result = await (getOccupancyData as any).execute({
      startDate: range.startISO,
      endDate: range.endISO,
      includeYoYComparison: true,
    });

    if (
      !result ||
      typeof result !== "object" ||
      ("error" in result && result.error)
    ) {
      return fallback;
    }

    const current = Array.isArray((result as any).current)
      ? (result as any).current
      : [];
    const comparison = Array.isArray((result as any).comparison)
      ? (result as any).comparison
      : [];

    if (!current.length) {
      return fallback;
    }

    return current.map((day: any, index: number) => ({
      date: day.date,
      occupancy: Number(day.occupancyRate ?? day.occupancy ?? 0),
      lastYearOccupancy: comparison[index]
        ? Number(
            comparison[index].occupancyRate ??
              comparison[index].occupancy ??
              null
          )
        : null,
    }));
  } catch {
    return fallback;
  }
}

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

export default async function DashboardPage() {
  const snapshot = getMockHotelSnapshot();
  const greeting = getGreeting(new Date());
  const actionsCount = snapshot.opportunities.length;
  const range = computeNextWeekRange();

  const fallbackOccupancy: OccupancyDisplay[] = snapshot.occupancy.map(
    (point, index) => {
      const base = new Date(range.start);
      base.setDate(range.start.getDate() + index);
      return {
        date: base.toISOString(),
        occupancy: point.occupancy,
        lastYearOccupancy: point.lastYearOccupancy,
      };
    }
  );

  const occupancy = await fetchWeeklyOccupancy(range, fallbackOccupancy);

  return (
    <main className="min-h-screen bg-[#050403] text-[#F4EDE5]">
      <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col px-3 pt-10 pb-28 sm:px-4">
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
            {snapshot.opportunities.map((opportunity) => (
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
                <Link
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#FF922C] px-5 py-2 font-semibold text-[#1D1107] text-sm shadow-[0_16px_30px_rgba(255,146,44,0.45)] transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF922C]/50"
                  href={`/opportunities/${opportunity.id}`}
                >
                  <span>{opportunity.ctaLabel}</span>
                  <ArrowRight className="size-4" />
                </Link>
              </article>
            ))}
          </div>
        </details>

        <MetricCarousel
          className="mt-8"
          slides={[
            <CompetitorPricingChart
              className=""
              data={snapshot.competitorPricing}
              key="competitor-pricing"
            />,
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
                      <div className="text-center">
                        <div className="font-medium text-neutral-200 text-xs">
                          {occupancy}%
                        </div>
                        <div className="text-neutral-500 text-[10px]">
                          {weekdayFormatter.format(date)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>,
          ]}
        />

        <section className="mt-10">
          <h2 className="text-center font-medium text-[#8F7F71] text-sm">
            Next week’s occupancy
          </h2>
          <div className="mt-5 flex items-end justify-between gap-2 rounded-[30px] border border-[#2F241C] bg-[#110D0A] px-5 py-6 shadow-[0_26px_48px_rgba(0,0,0,0.45)]">
            {occupancy.map((day) => {
              const current = Math.max(0, Math.min(day.occupancy, 100));
              const lastYearValue =
                typeof day.lastYearOccupancy === "number"
                  ? Math.max(0, Math.min(day.lastYearOccupancy, 100))
                  : null;
              const labelDate = new Date(day.date);
              return (
                <div
                  className="flex flex-col items-center gap-2"
                  key={day.date}
                >
                  <div className="relative flex h-32 w-8 items-end justify-center">
                    {lastYearValue !== null ? (
                      <span
                        aria-hidden
                        className="absolute bottom-0 w-full rounded-full bg-[#362A22]"
                        style={{ height: `${lastYearValue}%`, opacity: 0.55 }}
                      />
                    ) : null}
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
                    {lastYearValue !== null ? (
                      <span className="text-[#8B7B6D] text-[10px]">
                        LY {Math.round(lastYearValue)}%
                      </span>
                    ) : null}
                  </div>
                  <span className="mt-1 font-medium text-[#8B7B6D] text-xs">
                    {weekdayFormatter.format(labelDate)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <TodoList />
      </div>
    </main>
  );
}
