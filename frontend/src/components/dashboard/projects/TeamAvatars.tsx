import React from "react";

interface TeamMember {
  userId?: { name?: string } | string;
  name?: string;
}

interface Props {
  members: TeamMember[] | string[];
  max?: number;
}

const PALETTE = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-red-500",
  "bg-indigo-500",
  "bg-pink-500",
  "bg-teal-500",
];

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function resolveName(member: TeamMember | string): string {
  if (typeof member === "string") return member;
  if (typeof member.userId === "object" && member.userId?.name) return member.userId.name;
  if (member.name) return member.name;
  return "?";
}

export default function TeamAvatars({ members = [], max = 4 }: Props) {
  if (!members.length) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  const visible = members.slice(0, max);
  const overflow = members.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((m, i) => {
        const name = resolveName(m);
        const color = PALETTE[i % PALETTE.length];
        return (
          <div
            key={i}
            title={name}
            className={`w-7 h-7 rounded-full ${color} text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-zinc-900 ring-0`}
          >
            {initials(name)}
          </div>
        );
      })}
      {overflow > 0 && (
        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-zinc-900">
          +{overflow}
        </div>
      )}
    </div>
  );
}
