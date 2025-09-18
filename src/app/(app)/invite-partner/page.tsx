'use client';

import React from 'react';
import { useUser } from '@/contexts/UserContext';
import InvitePartnerForm from '@/components/invitation/InvitePartnerForm';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

export default function InvitePartnerPage() {
  const { isLoading: isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Heart className="w-8 h-8 text-white" />
          </motion.div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Invite Your Partner</h1>
          <p className="text-gray-600">DuoTrak works best with a partner. Invite someone to join you on your journey!</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden p-8"
        >
          <InvitePartnerForm />
        </motion.div>
      </div>
    </div>
  );
}
