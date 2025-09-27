import { MetricCarousel } from "@/components/dashboard/metric-carousel";
import { getMockHotelSnapshot } from "@/lib/demo/mock-hotel";

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
});

export default function DashboardPage() {
  const snapshot = getMockHotelSnapshot();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-10 bg-neutral-100 px-6 pt-10 pb-20 text-neutral-900 sm:max-w-2xl lg:max-w-5xl lg:px-10 xl:max-w-6xl">
      <header>
        <p className="text-neutral-500 text-sm uppercase tracking-wide lg:text-base">
          {snapshot.address}
        </p>
        <h1 className="mt-1 font-semibold text-3xl leading-tight lg:text-4xl">
          {snapshot.name}
        </h1>
      </header>

      <MetricCarousel
        slides={[
          <div className="space-y-6 lg:space-y-8" key="occupancy">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg lg:text-xl">
                Occupancy outlook
              </h2>
              <span className="text-neutral-400 text-xs lg:text-sm">
                vs. last year
              </span>
            </div>
            <div className="grid grid-cols-7 gap-2 lg:gap-3 xl:gap-4">
              {snapshot.occupancy.map((point) => {
                const date = new Date(point.date);

                return (
                  <div
                    className="flex flex-col items-center gap-2"
                    key={point.date}
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
                    <span className="font-medium text-neutral-500 text-xs lg:text-sm">
                      {weekdayFormatter.format(date)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-neutral-400 text-xs lg:text-sm">
              Pink bars show forecast occupancy. Pale bars show the same day
              last year.
            </p>
          </div>,
          <div className="space-y-3" key="room-mix">
            <h2 className="font-semibold text-lg">Room mix insights</h2>
            <p className="text-neutral-500 text-sm leading-relaxed">
              Placeholder for ADR, RevPAR, and category pacing trends. Swipe to
              explore other views while we hook up real data.
            </p>
            <div className="rounded-2xl border border-neutral-300 border-dashed p-6 text-center text-neutral-400 text-xs uppercase tracking-wide">
              Coming soon
            </div>
          </div>,
          <div className="space-y-3" key="staffing">
            <h2 className="font-semibold text-lg">Staffing forecast</h2>
            <p className="text-neutral-500 text-sm leading-relaxed">
              Another placeholder pane where we can surface labor needs,
              housekeeping turns, or sentiment alerts once the data pipeline is
              ready.
            </p>
            <div className="rounded-2xl border border-neutral-300 border-dashed p-6 text-center text-neutral-400 text-xs uppercase tracking-wide">
              Coming soon
            </div>
          </div>,
        ]}
      />

      <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-lg lg:text-xl">Opportunities</h2>
          <button
            className="font-medium text-rose-600 text-sm lg:text-base"
            type="button"
          >
            Refresh
          </button>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:gap-6">
          {snapshot.opportunities.map((opportunity, index) => (
            <article
              className="hover:-translate-y-1 rounded-2xl border border-neutral-200 p-4 shadow-sm transition hover:shadow-md lg:p-6"
              key={opportunity.id}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-400 text-sm lg:text-base">
                  {index + 1}
                </span>
                <span className="rounded-full bg-neutral-100 px-3 py-1 font-medium text-neutral-500 text-xs uppercase tracking-wide lg:text-sm">
                  {opportunity.type}
                </span>
              </div>
              <h3 className="mt-3 font-semibold text-base text-neutral-900 lg:text-lg">
                {opportunity.title}
              </h3>
              <p className="mt-2 text-neutral-600 text-sm leading-relaxed lg:text-base">
                {opportunity.description}
              </p>
              <button
                className="mt-4 inline-flex w-full items-center justify-between rounded-xl bg-neutral-900 px-4 py-3 font-medium text-sm text-white transition hover:bg-neutral-800 lg:text-base"
                type="button"
              >
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
