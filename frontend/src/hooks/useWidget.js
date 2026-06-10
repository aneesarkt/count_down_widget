import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { getWidget, updateShifts } from "@/lib/api";

export default function useWidget() {
  const [widget, setWidget] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getWidget()
      .then((data) => {
        if (active) setWidget(data);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load widget");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const setShifts = useCallback(async (next) => {
    if (next < 0) return;
    let prev = null;
    setWidget((w) => {
      if (!w) return w;
      prev = w;
      return { ...w, shifts_remaining: next };
    });
    try {
      const data = await updateShifts(next);
      setWidget(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save. Reverting.");
      if (prev) setWidget(prev);
    }
  }, []);

  return { widget, loading, setShifts };
}
