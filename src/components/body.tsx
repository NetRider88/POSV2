'use client';

import React, { useState, useEffect } from 'react';

type BodyProps = {
  children: React.ReactNode;
  className?: string;
};

export function Body({ children, className }: BodyProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return <body className={className}>{isClient ? children : null}</body>;
}
