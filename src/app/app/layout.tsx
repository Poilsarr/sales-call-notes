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
    <div className="flex h-screen bg-zinc-950">
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
        theme="dark"
        toastOptions={{
          style: {
            background: '#18181b',
            color: '#fafafa',
            border: '1px solid #3f3f46',
          },
        }}
      />
    </div>
  );
}
