export default function PageChrome({ loading, children }) {
  return (
    <main
      data-testid="widget-page"
      className="relative min-h-screen w-full overflow-hidden bg-[#050505] text-white"
    >
      <div
        aria-hidden
        className="bg-noise pointer-events-none absolute inset-0 z-0"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 z-0 h-[480px] w-[480px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(217,119,54,0.10) 0%, rgba(217,119,54,0) 70%)",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-between px-6 py-10 md:px-12 md:py-16">
        <PageHeader loading={loading} />
        {children}
        <PageFooter />
      </div>
    </main>
  );
}

function PageHeader({ loading }) {
  return (
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
  );
}

function PageFooter() {
  return (
    <footer className="flex w-full items-center justify-center">
      <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-600">
        Counting every shift · Counting every second
      </span>
    </footer>
  );
}
