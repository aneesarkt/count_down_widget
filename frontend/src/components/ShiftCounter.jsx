import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, EditPencil } from "iconoir-react";
import QuickEditDialog from "@/components/QuickEditDialog";

export default function ShiftCounter({ shifts, onChange, disabled }) {
  const [editOpen, setEditOpen] = useState(false);

  const canDecrement = shifts > 0 && !disabled;
  const canIncrement = !disabled;

  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-6"
      data-testid="shift-counter"
    >
      <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
        Shifts Remaining
      </span>

      <div className="flex w-full items-center justify-center gap-6 md:gap-12">
        <motion.button
          type="button"
          data-testid="minus-button"
          aria-label="Decrement shift"
          disabled={!canDecrement}
          onClick={() => onChange(shifts - 1)}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.04 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white shadow-[0_4px_24px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30 md:h-16 md:w-16"
        >
          <Minus className="h-5 w-5" strokeWidth={2} />
        </motion.button>

        <div className="relative flex flex-col items-center">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={shifts}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="font-mono-num text-7xl font-light leading-none tracking-tighter text-white md:text-[9rem]"
              data-testid="shift-display"
            >
              {shifts}
            </motion.span>
          </AnimatePresence>
        </div>

        <motion.button
          type="button"
          data-testid="plus-button"
          aria-label="Increment shift"
          disabled={!canIncrement}
          onClick={() => onChange(shifts + 1)}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.04 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white shadow-[0_4px_24px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30 md:h-16 md:w-16"
        >
          <Plus className="h-5 w-5" strokeWidth={2} />
        </motion.button>
      </div>

      <button
        type="button"
        data-testid="quick-edit-button"
        disabled={disabled}
        onClick={() => setEditOpen(true)}
        className="group mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-neutral-400 transition-colors hover:border-[#D97736]/40 hover:text-[#E68A4F] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <EditPencil className="h-3.5 w-3.5" strokeWidth={2} />
        Quick Edit
      </button>

      <QuickEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        currentValue={shifts}
        onSubmit={(val) => {
          onChange(val);
          setEditOpen(false);
        }}
      />
    </div>
  );
}
