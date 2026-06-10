import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import ShiftCounter from "@/components/ShiftCounter";
import LiveCountdown from "@/components/LiveCountdown";
import { getWidget, updateShifts } from "@/lib/api";

export default function WidgetPage() {
  const [widget, setWidget] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getWidget();
        setWidget(data);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load widget");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleShiftsChange = useCallback(
    async (next) => {
      if (next < 0) return;
      const prev = widget;
      // optimistic update
      setWidget((w) => (w ? { ...w, shifts_remaining: next } : w));
      try {
        const data = await updateShifts(next);
        setWidget(data);
      } catch (e) {
        console.error(e);
        toast.error("Failed to save. Reverting.");
        setWidget(prev);
      }
    },
    [widget],
  );

  return (
    <main
      data-testid="widget-page"
      className="relative min-h-screen w-full overflow-hidden bg-[#050505] text-white"
    >
      {/* Background texture */}
      <div
        aria-hidden
        className="bg-noise pointer-events-none absolute inset-0 z-0"
      />
      {/* Subtle ambient accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 z-0 h-[480px] w-[480px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(217,119,54,0.10) 0%, rgba(217,119,54,0) 70%)",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-between px-6 py-10 md:px-12 md:py-16">
        {/* Header */}
        <header className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[#D97736]" />
            <span className="font-mono-num text-[10px] uppercase tracking-[0.3em] text-neutral-500">
              Retirement Protocol
            </span>
          </div>
          <span
            className="font-mono-num text-[10px] uppercase tracking-[0.3em] text-neutral-600"
            data-testid="widget-status"
          >
            {loading ? "Loading" : "Live"}
          </span>
        </header>

        {/* Center widget */}
        <section className="flex w-full flex-1 flex-col items-center justify-center gap-16 py-12 md:gap-24">
          <ShiftCounter
            shifts={widget?.shifts_remaining ?? 1025}
            onChange={handleShiftsChange}
            disabled={loading}
          />

          <div className="w-full">
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="h-px w-12 bg-white/10" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                Time Until Retirement
              </span>
              <div className="h-px w-12 bg-white/10" />
            </div>
            <LiveCountdown targetDate={widget?.target_date} />
          </div>
        </section>

        {/* Footer */}
        <footer className="flex w-full items-center justify-center">
          <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-600">
            Counting every shift · Counting every second
          </span>
        </footer>
      </div>
    </main>
  );
}
