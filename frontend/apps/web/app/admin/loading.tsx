import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px] bg-white border border-gray-100 rounded-2xl shadow-sm">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-semibold text-gray-500">Loading data...</p>
      </div>
    </div>
  );
}
