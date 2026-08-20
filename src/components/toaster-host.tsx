"use client";

import { Toaster } from "sonner";

export default function ToasterHost() {
  return (
    <Toaster
      position="top-right"
      theme="dark"
      toastOptions={{
        style: {
          background: '#141416',
          color: '#ffffff',
          border: '1px solid #1c1c20',
        },
      }}
    />
  );
}