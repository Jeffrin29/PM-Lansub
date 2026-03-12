import React from "react";
import { FaShieldAlt } from "react-icons/fa";

type Risk = "low" | "medium" | "high" | "critical";

const RISK_CONFIG: Record<Risk, { label: string; className: string; icon: string }> = {
  low:      { label: "Low",      className: "text-green-600 dark:text-green-400",  icon: "text-green-500"  },
  medium:   { label: "Medium",   className: "text-yellow-600 dark:text-yellow-400", icon: "text-yellow-500" },
  high:     { label: "High",     className: "text-red-600 dark:text-red-400",       icon: "text-red-500"    },
  critical: { label: "Critical", className: "text-red-700 dark:text-red-300",       icon: "text-red-600"    },
};

interface Props {
  level: Risk | string;
}

export default function RiskIndicator({ level }: Props) {
  const key = level?.toLowerCase() as Risk;
  const cfg = RISK_CONFIG[key] ?? RISK_CONFIG.low;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.className}`}>
      <FaShieldAlt className={`text-[10px] ${cfg.icon}`} />
      {cfg.label}
    </span>
  );
}
