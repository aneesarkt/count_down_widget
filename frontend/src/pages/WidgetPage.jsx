import ShiftCounter from "@/components/ShiftCounter";
import LiveCountdown from "@/components/LiveCountdown";
import PageChrome from "@/components/PageChrome";
import useWidget from "@/hooks/useWidget";

export default function WidgetPage() {
  const { widget, loading, setShifts } = useWidget();

  return (
    <PageChrome loading={loading}>
      <section className="flex w-full flex-1 flex-col items-center justify-center gap-16 py-12 md:gap-24">
        <ShiftCounter
          shifts={widget?.shifts_remaining ?? 1025}
          onChange={setShifts}
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
    </PageChrome>
  );
}
