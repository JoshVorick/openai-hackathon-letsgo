import { MetricCarousel } from "@/components/dashboard/metric-carousel";
import { getMockHotelSnapshot } from "@/lib/demo/mock-hotel";

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
});

export default function DashboardPage() {
  const snapshot = getMockHotelSnapshot();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-10 bg-neutral-100 px-6 pb-20 pt-10 text-neutral-900 sm:max-w-2xl lg:max-w-5xl lg:px-10 xl:max-w-6xl">
      <header>
        <p className="text-sm uppercase tracking-wide text-neutral-500 lg:text-base">
          {snapshot.address}
        </p>
        <h1 className="mt-1 text-3xl font-semibold leading-tight lg:text-4xl">
          {snapshot.name}
        </h1>
      </header>

      <MetricCarousel
        slides={[
          (
            <div className="space-y-6 lg:space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold lg:text-xl">Occupancy outlook</h2>
                <span className="text-xs text-neutral-400 lg:text-sm">vs. last year</span>
              </div>
              <div className="grid grid-cols-7 gap-2 lg:gap-3 xl:gap-4">
                {snapshot.occupancy.map((point) => {
                  const date = new Date(point.date);

                  return (
                    <div
                      key={point.date}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="flex h-28 w-6 items-end justify-center gap-[3px] lg:h-40 lg:w-7">
                        <div
                          className="w-2 rounded-full bg-rose-500"
                          style={{
                            height: `${point.occupancy}%`,
                            maxHeight: "100%",
                          }}
                        />
                        <div
                          className="w-2 rounded-full bg-neutral-200"
                          style={{
                            height: `${point.lastYearOccupancy}%`,
                            maxHeight: "100%",
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-neutral-500 lg:text-sm">
                        {weekdayFormatter.format(date)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-neutral-400 lg:text-sm">
                Pink bars show forecast occupancy. Pale bars show the same day
                last year.
              </p>
            </div>
          ),
          (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Room mix insights</h2>
              <p className="text-sm leading-relaxed text-neutral-500">
                Placeholder for ADR, RevPAR, and category pacing trends. Swipe
                to explore other views while we hook up real data.
              </p>
              <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center text-xs uppercase tracking-wide text-neutral-400">
                Coming soon
              </div>
            </div>
          ),
          (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Staffing forecast</h2>
              <p className="text-sm leading-relaxed text-neutral-500">
                Another placeholder pane where we can surface labor needs,
                housekeeping turns, or sentiment alerts once the data pipeline
                is ready.
              </p>
              <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center text-xs uppercase tracking-wide text-neutral-400">
                Coming soon
              </div>
            </div>
          ),
        ]}
      />

      <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold lg:text-xl">Opportunities</h2>
          <button className="text-sm font-medium text-rose-600 lg:text-base">
            Refresh
          </button>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:gap-6">
          {snapshot.opportunities.map((opportunity, index) => (
            <article
              key={opportunity.id}
              className="rounded-2xl border border-neutral-200 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md lg:p-6"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-400 lg:text-base">
                  {index + 1}
                </span>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-neutral-500 lg:text-sm">
                  {opportunity.type}
                </span>
              </div>
              <h3 className="mt-3 text-base font-semibold text-neutral-900 lg:text-lg">
                {opportunity.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600 lg:text-base">
                {opportunity.description}
              </p>
              <button className="mt-4 inline-flex w-full items-center justify-between rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 lg:text-base">
                <span>{opportunity.ctaLabel}</span>
                <span aria-hidden>→</span>
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
