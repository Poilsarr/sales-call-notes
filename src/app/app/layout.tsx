'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { Toaster } from 'sonner';
import { motion } from 'framer-motion';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-white">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="p-8"
        >
          {children}
        </motion.div>
      </main>
      <Toaster
        position="top-right"
        theme="light"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#111111',
            border: '1px solid #e5e5e5',
          },
        }}
      />
    </div>
  );
}
