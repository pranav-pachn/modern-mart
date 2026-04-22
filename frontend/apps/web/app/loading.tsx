import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="p-4 bg-white shadow-sm rounded-2xl border border-gray-100 flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-semibold text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
