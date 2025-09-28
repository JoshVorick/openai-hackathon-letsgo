"use client";

import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type MetricCarouselProps = {
  slides: ReactNode[];
  className?: string;
};

const SWIPE_THRESHOLD = 40;

export function MetricCarousel({ slides, className }: MetricCarouselProps) {
  const [index, setIndex] = useState(0);
  const startXRef = useRef<number | null>(null);

  const clampedIndex = useMemo(() => {
    return Math.min(Math.max(index, 0), slides.length - 1);
  }, [index, slides.length]);

  function goTo(delta: number) {
    setIndex((prev) => {
      const next = prev + delta;
      if (next < 0) {
        return 0;
      }
      if (next > slides.length - 1) {
        return slides.length - 1;
      }
      return next;
    });
  }

  function handleStart(clientX: number) {
    startXRef.current = clientX;
  }

  function handleMove(clientX: number) {
    if (startXRef.current == null) {
      return;
    }
    const deltaX = startXRef.current - clientX;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      goTo(deltaX > 0 ? 1 : -1);
      startXRef.current = null;
    }
  }

  function handleEnd() {
    startXRef.current = null;
  }

  return (
    <div className={cn("relative", className)}>
      <div
        className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_20px_60px_-60px_rgba(15,15,15,0.9)] backdrop-blur"
        onPointerDown={(event) => handleStart(event.clientX)}
        onPointerMove={(event) => {
          if (event.buttons === 0) {
            return;
          }
          handleMove(event.clientX);
        }}
        onPointerUp={handleEnd}
        onTouchEnd={handleEnd}
        onTouchMove={(event) => handleMove(event.touches[0]?.clientX ?? 0)}
        onTouchStart={(event) => handleStart(event.touches[0]?.clientX ?? 0)}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${clampedIndex * 100}%)` }}
        >
          {slides.map((slide, slideIndex) => (
            <div
              className="w-full shrink-0 px-8 py-8"
              key={`slide-${slideIndex}`}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        {slides.map((_, dotIndex) => (
          <span
            className={cn(
              "h-2 w-5 rounded-full transition-all",
              dotIndex === clampedIndex ? "bg-rose-500" : "bg-neutral-700"
            )}
            key={`dot-${dotIndex}`}
          />
        ))}
      </div>
    </div>
  );
}
