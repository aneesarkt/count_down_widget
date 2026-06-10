import { useEffect, useMemo, useState } from "react";

const SEGMENT_KEYS = [
  "years",
  "months",
  "days",
  "hours",
  "minutes",
  "seconds",
];

const SEGMENT_DEFS = [
  { key: "years", label: "Years", testid: "countdown-years" },
  { key: "months", label: "Months", testid: "countdown-months" },
  { key: "days", label: "Days", testid: "countdown-days" },
  { key: "hours", label: "Hours", testid: "countdown-hours" },
  { key: "minutes", label: "Minutes", testid: "countdown-minutes" },
  { key: "seconds", label: "Seconds", testid: "countdown-seconds" },
];

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

function Segment({ value, label, testid }) {
  return (
    <div
      data-testid={testid}
      className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#0c0c0c] px-2 py-5 md:py-6"
    >
      <span className="font-mono-num text-3xl font-light leading-none tracking-tighter text-white md:text-5xl">
        {pad(value)}
      </span>
      <span className="mt-3 text-[9px] uppercase tracking-[0.25em] text-neutral-500 md:text-[10px]">
        {label}
      </span>
    </div>
  );
}

function CountdownSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
      {SEGMENT_KEYS.map((k) => (
        <div
          key={k}
          className="h-24 animate-pulse rounded-2xl border border-white/5 bg-[#0c0c0c]"
        />
      ))}
    </div>
  );
}

function useCountdown(target) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!target) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [target]);

  return useMemo(() => {
    // tick is part of deps to force recompute on each interval
    void tick;
    return target ? computeDiff(target) : null;
  }, [target, tick]);
}

export default function LiveCountdown({ targetDate }) {
  const target = useMemo(
    () => (targetDate ? new Date(targetDate) : null),
    [targetDate],
  );
  const diff = useCountdown(target);

  if (!diff) return <CountdownSkeleton />;

  return (
    <div
      data-testid="live-countdown"
      className="grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4"
    >
      {SEGMENT_DEFS.map((s) => (
        <Segment
          key={s.key}
          value={diff[s.key]}
          label={s.label}
          testid={s.testid}
        />
      ))}
    </div>
  );
}
