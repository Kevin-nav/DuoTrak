'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WelcomeContextType {
  hasSeenAnimation: boolean;
  setHasSeenAnimation: (hasSeen: boolean) => void;
}

const WelcomeContext = createContext<WelcomeContextType | undefined>(undefined);

export const WelcomeProvider = ({ children }: { children: ReactNode }) => {
  const [hasSeenAnimation, setHasSeenAnimation] = useState(false);

  return (
    <WelcomeContext.Provider value={{ hasSeenAnimation, setHasSeenAnimation }}>
      {children}
    </WelcomeContext.Provider>
  );
};

export const useWelcome = () => {
  const context = useContext(WelcomeContext);
  if (context === undefined) {
    throw new Error('useWelcome must be used within a WelcomeProvider');
  }
  return context;
};
