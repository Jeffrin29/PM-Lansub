export default function Avatar({ name }: { name: string }) {

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs font-semibold">
      {initials}
    </div>
  );
}