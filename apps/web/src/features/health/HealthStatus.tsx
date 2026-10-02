import { useHealth } from "./useHealth.js";

export function HealthStatus() {
  const { data, isLoading, isError } = useHealth();

  if (isLoading) {
    return <span className="text-slate-500">Checking…</span>;
  }
  if (isError) {
    return <span className="text-red-600">API unreachable</span>;
  }
  return <span className="text-green-600">API status: {data?.status}</span>;
}
