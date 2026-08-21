"use client";
import { motion, AnimatePresence } from "framer-motion";

export function VizTooltip({
  open,
  x,
  y,
  children,
}: {
  open: boolean;
  x: number;
  y: number;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.18, ease: [0.19, 1, 0.22, 1] }}
          className="pointer-events-none absolute z-20 rounded-xl border border-white/10 bg-[#1c1c20] px-3 py-2 shadow-xl"
          style={{ left: x, top: y, transform: "translate(-50%, -100%) translateY(-8px)" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
