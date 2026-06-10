import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function EditForm({ currentValue, onSubmit, onCancel }) {
  const [value, setValue] = useState(String(currentValue ?? 0));
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const n = parseInt(value, 10);
    if (Number.isNaN(n) || n < 0) {
      setError("Please enter a whole number (0 or greater)");
      return;
    }
    onSubmit(n);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <Input
        data-testid="quick-edit-input"
        type="number"
        min="0"
        step="1"
        value={value}
        autoFocus
        onChange={(e) => setValue(e.target.value)}
        className="font-mono-num h-14 border-white/10 bg-[#121212] text-2xl tracking-tighter text-white focus-visible:ring-[#D97736]/60"
      />
      {error && (
        <p data-testid="quick-edit-error" className="text-xs text-red-400">
          {error}
        </p>
      )}

      <DialogFooter className="gap-2 pt-2 sm:gap-2">
        <Button
          type="button"
          variant="ghost"
          data-testid="quick-edit-cancel"
          onClick={onCancel}
          className="text-neutral-400 hover:bg-white/5 hover:text-white"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          data-testid="quick-edit-submit"
          className="bg-[#D97736] text-black hover:bg-[#E68A4F]"
        >
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function QuickEditDialog({
  open,
  onOpenChange,
  currentValue,
  onSubmit,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="quick-edit-dialog"
        className="border-white/10 bg-[#0a0a0a] text-white sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="font-light tracking-tight text-white">
            Set Shifts Remaining
          </DialogTitle>
          <DialogDescription className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
            Enter the exact number
          </DialogDescription>
        </DialogHeader>

        {open && (
          <EditForm
            currentValue={currentValue}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
