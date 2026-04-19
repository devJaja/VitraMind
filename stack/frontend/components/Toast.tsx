"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onDone: () => void;
}

export function Toast({ message, type = "info", onDone }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  const colors = {
    success: "bg-green-500 text-black",
    error:   "bg-red-500 text-white",
    info:    "bg-gray-700 text-white",
  };

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full text-sm font-semibold shadow-xl animate-bounce-in ${colors[type]}`}>
      {message}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  function show(message: string, type: "success" | "error" | "info" = "info") {
    setToast({ message, type });
  }

  const node = toast ? <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} /> : null;

  return { show, node };
}
