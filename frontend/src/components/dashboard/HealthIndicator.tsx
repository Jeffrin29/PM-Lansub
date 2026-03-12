export default function HealthIndicator({ progress }: { progress: number }) {

  let status = "Healthy";
  let color = "text-green-500";

  if (progress < 40) {
    status = "Critical";
    color = "text-red-500";
  } else if (progress < 70) {
    status = "Risk";
    color = "text-yellow-500";
  }

  return (
    <span className={`text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}