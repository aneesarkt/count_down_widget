import { useEffect, useMemo, useState } from "react";

function computeDiff(target) {
  const now = new Date();
  let years = target.getFullYear() - now.getFullYear();
  let months = target.getMonth() - now.getMonth();
  let days = target.getDate() - now.getDate();
  let hours = target.getHours() - now.getHours();
  let minutes = target.getMinutes() - now.getMinutes();
  let seconds = target.getSeconds() - now.getSeconds();

  if (seconds < 0) {
    seconds += 60;
    minutes -= 1;
  }
  if (minutes < 0) {
    minutes += 60;
    hours -= 1;
  }
  if (hours < 0) {
    hours += 24;
    days -= 1;
  }
  if (days < 0) {
    const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
    days += prevMonth.getDate();
    months -= 1;
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }

  if (years < 0) {
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      done: true,
    };
  }
  return { years, months, days, hours, minutes, seconds, done: false };
}

const pad = (n, w = 2) => String(n).padStart(w, "0");

const Segment = ({ value, label, testid, width = 2 }) => (
  <div
    data-testid={testid}
    className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#0c0c0c] px-2 py-5 md:py-6"
  >
    <span className="font-mono-num text-3xl font-light leading-none tracking-tighter text-white md:text-5xl">
      {pad(value, width)}
    </span>
    <span className="mt-3 text-[9px] uppercase tracking-[0.25em] text-neutral-500 md:text-[10px]">
      {label}
    </span>
  </div>
);

export default function LiveCountdown({ targetDate }) {
  const target = useMemo(
    () => (targetDate ? new Date(targetDate) : null),
    [targetDate],
  );

  // Tick counter to trigger re-render every second. setState lives only inside
  // the interval callback (event-like), not synchronously in the effect body.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!target) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [target]);

  // Derive diff each render; depends on target + tick.
  const diff = useMemo(() => {
    if (!target) return null;
    // tick is referenced to force recompute every interval
    void tick;
    return computeDiff(target);
  }, [target, tick]);

  if (!diff) {
    return (
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-white/5 bg-[#0c0c0c]"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      data-testid="live-countdown"
      className="grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4"
    >
      <Segment value={diff.years} label="Years" testid="countdown-years" />
      <Segment value={diff.months} label="Months" testid="countdown-months" />
      <Segment value={diff.days} label="Days" testid="countdown-days" />
      <Segment value={diff.hours} label="Hours" testid="countdown-hours" />
      <Segment
        value={diff.minutes}
        label="Minutes"
        testid="countdown-minutes"
      />
      <Segment
        value={diff.seconds}
        label="Seconds"
        testid="countdown-seconds"
      />
    </div>
  );
}
