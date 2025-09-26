
'use client';

import { createContext, useContext, useState, ReactNode, useMemo } from 'react';

interface ValidationContextType {
  menuPushPassed: boolean;
  orderPayloadPassed: boolean;
  allTestsPassed: boolean;
  setMenuPushPassed: (passed: boolean) => void;
  setOrderPayloadPassed: (passed: boolean) => void;
}

const ValidationContext = createContext<ValidationContextType | undefined>(undefined);

export function ValidationProvider({ children }: { children: ReactNode }) {
  const [menuPushPassed, setMenuPushPassed] = useState(false);
  const [orderPayloadPassed, setOrderPayloadPassed] = useState(false);

  const allTestsPassed = useMemo(() => menuPushPassed && orderPayloadPassed, [menuPushPassed, orderPayloadPassed]);

  const value = {
    menuPushPassed,
    orderPayloadPassed,
    allTestsPassed,
    setMenuPushPassed,
    setOrderPayloadPassed,
  };

  return (
    <ValidationContext.Provider value={value}>
      {children}
    </ValidationContext.Provider>
  );
}

export function useValidation() {
  const context = useContext(ValidationContext);
  if (context === undefined) {
    throw new Error('useValidation must be used within a ValidationProvider');
  }
  return context;
}
