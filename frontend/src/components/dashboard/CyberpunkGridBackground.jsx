import React from "react";
import { motion } from "framer-motion";

const NEON = {
  cyan: "#22D3EE",
};

export default function CyberpunkGridBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(0deg, rgba(34,211,238,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.03) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          mixBlendMode: "overlay",
        }}
      />
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{ background: `linear-gradient(180deg, transparent 0%, ${NEON.cyan}11 40%, transparent 80%)` }}
        animate={{ y: ["-10%", "110%"] }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/60" />
      <div
        className="absolute inset-0 opacity-6"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='f'%3E%3CfeTurbulence baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)' opacity='0.06'/%3E%3C/svg%3E\")",
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
}
