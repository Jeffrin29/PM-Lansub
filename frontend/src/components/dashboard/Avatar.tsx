export default function Avatar({ name, size = "md" }: { name: string, size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const sizeCls = size === "sm" ? "w-6 h-6 text-[10px]" : size === "lg" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs";

  return (
    <div className={`${sizeCls} flex items-center justify-center rounded-full bg-blue-600 text-white font-bold shadow-sm`}>
      {initials}
    </div>
  );
}