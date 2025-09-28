"use client";

import cx from "classnames";
import { format, isWithinInterval } from "date-fns";
import { useEffect, useState } from "react";

type WeatherAtLocation = {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units: {
    time: string;
    interval: string;
    temperature_2m: string;
  };
  current: {
    time: string;
    interval: number;
    temperature_2m: number;
  };
  hourly_units: {
    time: string;
    temperature_2m: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
  };
  daily_units: {
    time: string;
    sunrise: string;
    sunset: string;
  };
  daily: {
    time: string[];
    sunrise: string[];
    sunset: string[];
  };
};

type WeatherSummary = {
  error?: string;
  location?: {
    address?: string;
    coordinates?: { latitude: number; longitude: number };
  };
  current?: {
    date?: string;
    temperature?: number | null;
    temperatureMax?: number | null;
    temperatureMin?: number | null;
    weatherCode?: number | null;
    windSpeed?: number | null;
  };
  historical?: {
    date?: string;
    temperatureMax?: number | null;
    temperatureMin?: number | null;
  } | null;
  comparison?: {
    temperatureMaxChange?: number | null;
    temperatureMinChange?: number | null;
  } | null;
};

const isWeatherDataset = (value: unknown): value is WeatherAtLocation => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<WeatherAtLocation>;
  return (
    Array.isArray(candidate.hourly?.temperature_2m) &&
    Array.isArray(candidate.hourly?.time) &&
    candidate.hourly.temperature_2m.length === candidate.hourly.time.length &&
    typeof candidate.current?.temperature_2m === "number" &&
    Array.isArray(candidate.daily?.sunrise) &&
    Array.isArray(candidate.daily?.sunset) &&
    candidate.daily.sunrise.length > 0 &&
    candidate.daily.sunset.length > 0
  );
};

const isWeatherSummary = (value: unknown): value is WeatherSummary => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as WeatherSummary;

  if (typeof candidate.error === "string") {
    return true;
  }

  return (
    !!candidate.current &&
    (typeof candidate.current.temperature === "number" ||
      typeof candidate.current.temperatureMax === "number" ||
      typeof candidate.current.temperatureMin === "number")
  );
};

const SAMPLE = {
  latitude: 37.763_283,
  longitude: -122.412_86,
  generationtime_ms: 0.027_894_973_754_882_812,
  utc_offset_seconds: 0,
  timezone: "GMT",
  timezone_abbreviation: "GMT",
  elevation: 18,
  current_units: { time: "iso8601", interval: "seconds", temperature_2m: "°C" },
  current: { time: "2024-10-07T19:30", interval: 900, temperature_2m: 29.3 },
  hourly_units: { time: "iso8601", temperature_2m: "°C" },
  hourly: {
    time: [
      "2024-10-07T00:00",
      "2024-10-07T01:00",
      "2024-10-07T02:00",
      "2024-10-07T03:00",
      "2024-10-07T04:00",
      "2024-10-07T05:00",
      "2024-10-07T06:00",
      "2024-10-07T07:00",
      "2024-10-07T08:00",
      "2024-10-07T09:00",
      "2024-10-07T10:00",
      "2024-10-07T11:00",
      "2024-10-07T12:00",
      "2024-10-07T13:00",
      "2024-10-07T14:00",
      "2024-10-07T15:00",
      "2024-10-07T16:00",
      "2024-10-07T17:00",
      "2024-10-07T18:00",
      "2024-10-07T19:00",
      "2024-10-07T20:00",
      "2024-10-07T21:00",
      "2024-10-07T22:00",
      "2024-10-07T23:00",
      "2024-10-08T00:00",
      "2024-10-08T01:00",
      "2024-10-08T02:00",
      "2024-10-08T03:00",
      "2024-10-08T04:00",
      "2024-10-08T05:00",
      "2024-10-08T06:00",
      "2024-10-08T07:00",
      "2024-10-08T08:00",
      "2024-10-08T09:00",
      "2024-10-08T10:00",
      "2024-10-08T11:00",
      "2024-10-08T12:00",
      "2024-10-08T13:00",
      "2024-10-08T14:00",
      "2024-10-08T15:00",
      "2024-10-08T16:00",
      "2024-10-08T17:00",
      "2024-10-08T18:00",
      "2024-10-08T19:00",
      "2024-10-08T20:00",
      "2024-10-08T21:00",
      "2024-10-08T22:00",
      "2024-10-08T23:00",
      "2024-10-09T00:00",
      "2024-10-09T01:00",
      "2024-10-09T02:00",
      "2024-10-09T03:00",
      "2024-10-09T04:00",
      "2024-10-09T05:00",
      "2024-10-09T06:00",
      "2024-10-09T07:00",
      "2024-10-09T08:00",
      "2024-10-09T09:00",
      "2024-10-09T10:00",
      "2024-10-09T11:00",
      "2024-10-09T12:00",
      "2024-10-09T13:00",
      "2024-10-09T14:00",
      "2024-10-09T15:00",
      "2024-10-09T16:00",
      "2024-10-09T17:00",
      "2024-10-09T18:00",
      "2024-10-09T19:00",
      "2024-10-09T20:00",
      "2024-10-09T21:00",
      "2024-10-09T22:00",
      "2024-10-09T23:00",
      "2024-10-10T00:00",
      "2024-10-10T01:00",
      "2024-10-10T02:00",
      "2024-10-10T03:00",
      "2024-10-10T04:00",
      "2024-10-10T05:00",
      "2024-10-10T06:00",
      "2024-10-10T07:00",
      "2024-10-10T08:00",
      "2024-10-10T09:00",
      "2024-10-10T10:00",
      "2024-10-10T11:00",
      "2024-10-10T12:00",
      "2024-10-10T13:00",
      "2024-10-10T14:00",
      "2024-10-10T15:00",
      "2024-10-10T16:00",
      "2024-10-10T17:00",
      "2024-10-10T18:00",
      "2024-10-10T19:00",
      "2024-10-10T20:00",
      "2024-10-10T21:00",
      "2024-10-10T22:00",
      "2024-10-10T23:00",
      "2024-10-11T00:00",
      "2024-10-11T01:00",
      "2024-10-11T02:00",
      "2024-10-11T03:00",
    ],
    temperature_2m: [
      36.6, 32.8, 29.5, 28.6, 29.2, 28.2, 27.5, 26.6, 26.5, 26, 25, 23.5, 23.9,
      24.2, 22.9, 21, 24, 28.1, 31.4, 33.9, 32.1, 28.9, 26.9, 25.2, 23, 21.1,
      19.6, 18.6, 17.7, 16.8, 16.2, 15.5, 14.9, 14.4, 14.2, 13.7, 13.3, 12.9,
      12.5, 13.5, 15.8, 17.7, 19.6, 21, 21.9, 22.3, 22, 20.7, 18.9, 17.9, 17.3,
      17, 16.7, 16.2, 15.6, 15.2, 15, 15, 15.1, 14.8, 14.8, 14.9, 14.7, 14.8,
      15.3, 16.2, 17.9, 19.6, 20.5, 21.6, 21, 20.7, 19.3, 18.7, 18.4, 17.9,
      17.3, 17, 17, 16.8, 16.4, 16.2, 16, 15.8, 15.7, 15.4, 15.4, 16.1, 16.7,
      17, 18.6, 19, 19.5, 19.4, 18.5, 17.9, 17.5, 16.7, 16.3, 16.1,
    ],
  },
  daily_units: {
    time: "iso8601",
    sunrise: "iso8601",
    sunset: "iso8601",
  },
  daily: {
    time: [
      "2024-10-07",
      "2024-10-08",
      "2024-10-09",
      "2024-10-10",
      "2024-10-11",
    ],
    sunrise: [
      "2024-10-07T07:15",
      "2024-10-08T07:16",
      "2024-10-09T07:17",
      "2024-10-10T07:18",
      "2024-10-11T07:19",
    ],
    sunset: [
      "2024-10-07T19:00",
      "2024-10-08T18:58",
      "2024-10-09T18:57",
      "2024-10-10T18:55",
      "2024-10-11T18:54",
    ],
  },
};

function n(num: number): number {
  return Math.ceil(num);
}

export function Weather({
  weatherAtLocation,
}: {
  weatherAtLocation?: WeatherAtLocation | WeatherSummary | null;
}) {
  const dataset = isWeatherDataset(weatherAtLocation)
    ? weatherAtLocation
    : !weatherAtLocation && isWeatherDataset(SAMPLE)
      ? SAMPLE
      : null;
  const summary = isWeatherSummary(weatherAtLocation)
    ? (weatherAtLocation as WeatherSummary)
    : null;

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (dataset) {
    const currentHigh = Math.max(...dataset.hourly.temperature_2m.slice(0, 24));
    const currentLow = Math.min(...dataset.hourly.temperature_2m.slice(0, 24));

    const isDay = isWithinInterval(new Date(dataset.current.time), {
      start: new Date(dataset.daily.sunrise[0]),
      end: new Date(dataset.daily.sunset[0]),
    });

    const hoursToShow = isMobile ? 5 : 6;

    const currentTimeIndex = dataset.hourly.time.findIndex(
      (time) => new Date(time) >= new Date(dataset.current.time)
    );
    const startIndex = currentTimeIndex === -1 ? 0 : currentTimeIndex;

    const displayTimes = dataset.hourly.time.slice(
      startIndex,
      startIndex + hoursToShow
    );
    const displayTemperatures = dataset.hourly.temperature_2m.slice(
      startIndex,
      startIndex + hoursToShow
    );

    return (
      <div
        className={cx(
          "skeleton-bg flex max-w-[500px] flex-col gap-4 rounded-2xl p-4",
          {
            "bg-blue-400": isDay,
          },
          {
            "bg-indigo-900": !isDay,
          }
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cx(
                "skeleton-div size-10 rounded-full",
                {
                  "bg-yellow-300": isDay,
                },
                {
                  "bg-indigo-100": !isDay,
                }
              )}
            />
            <div>
              <p className="font-semibold text-sm text-white">
                {format(new Date(dataset.current.time), "EEEE, MMM d")}
              </p>
              <h2 className="font-bold text-4xl text-white">
                {n(dataset.current.temperature_2m)}
                {dataset.current_units.temperature_2m}
              </h2>
              <p className="text-sm text-white/75">
                High {n(currentHigh)}° · Low {n(currentLow)}°
              </p>
            </div>
          </div>
          <div className="text-right text-sm text-white">
            <p>Sunrise {format(new Date(dataset.daily.sunrise[0]), "p")}</p>
            <p>Sunset {format(new Date(dataset.daily.sunset[0]), "p")}</p>
            <p>Feels like {n(dataset.current.temperature_2m)}°</p>
          </div>
        </div>

        <div className="flex gap-2">
          {displayTimes.map((time, idx) => (
            <div
              className={cx(
                "flex flex-1 flex-col items-center gap-1 rounded-lg bg-white/15 p-2 text-white text-xs",
                {
                  "bg-white/30": idx === 0,
                }
              )}
              key={time}
            >
              <span className="font-medium">
                {idx === 0 ? "Now" : format(new Date(time), "ha")}
              </span>
              <span>{n(displayTemperatures[idx])}°</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (summary) {
    if (summary.error) {
      return (
        <div className="rounded-xl border border-border/60 bg-muted/40 p-4 text-sm">
          {summary.error}
        </div>
      );
    }

    const { current, historical, comparison, location } = summary;

    return (
      <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-sm">
                {current?.date
                  ? format(new Date(current.date), "EEEE, MMM d")
                  : "Current conditions"}
              </p>
              <p className="text-muted-foreground text-xs">
                {location?.address ?? "Hotel location"}
              </p>
            </div>
            {typeof current?.temperature === "number" && (
              <p className="font-semibold text-2xl">
                {n(current.temperature)}°
              </p>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md bg-background p-3">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                Today
              </p>
              <p className="text-sm">
                High {formatTemp(current?.temperatureMax)} · Low{" "}
                {formatTemp(current?.temperatureMin)}
              </p>
              {typeof current?.windSpeed === "number" && (
                <p className="text-muted-foreground text-xs">
                  Wind {Math.round(current.windSpeed)} km/h
                </p>
              )}
            </div>

            {historical && (
              <div className="rounded-md bg-background p-3">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Same day last year
                </p>
                <p className="text-sm">
                  High {formatTemp(historical.temperatureMax)} · Low{" "}
                  {formatTemp(historical.temperatureMin)}
                </p>
              </div>
            )}

            {comparison && (
              <div className="rounded-md bg-background p-3">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Change vs last year
                </p>
                <p className="text-sm">
                  Max {formatDelta(comparison.temperatureMaxChange)} · Min{" "}
                  {formatDelta(comparison.temperatureMinChange)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (
    weatherAtLocation &&
    typeof weatherAtLocation === "object" &&
    "error" in (weatherAtLocation as any)
  ) {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/40 p-4 text-sm">
        {(weatherAtLocation as { error?: string }).error ??
          "Weather data is currently unavailable."}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-muted/40 p-4 text-sm">
      Weather data is currently unavailable for this request.
    </div>
  );
}

const formatTemp = (value: number | null | undefined) =>
  typeof value === "number" && !Number.isNaN(value) ? `${n(value)}°` : "—";

const formatDelta = (value: number | null | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}°`;
};
