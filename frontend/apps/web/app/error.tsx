"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8" />
      </div>
      
      <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
        Something went wrong!
      </h1>
      <p className="text-gray-500 max-w-md mx-auto mb-8">
        We encountered an unexpected error. Please try again or return to the homepage.
      </p>

      <div className="flex items-center gap-4">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition shadow-sm"
        >
          <RefreshCcw className="w-4 h-4" />
          Try again
        </button>
        <Link
          href="/"
          className="px-6 py-3 bg-white text-gray-900 font-bold border border-gray-200 rounded-xl hover:bg-gray-50 transition"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
