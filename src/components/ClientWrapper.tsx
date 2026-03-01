'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const AccessibilityWidget = dynamic(() => 
  import('@/components/AccessibilityWidget').then(mod => mod.AccessibilityWidget),
  { ssr: false }
);

const Vlibras = dynamic(() => 
  import('@/components/Vlibras').then(mod => mod.Vlibras),
  { ssr: false }
);

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAuthPage = ['/login', '/register', '/'].includes(pathname || '');

  return (
    <>
      {children}
      {!isAuthPage && (
        <>
          <AccessibilityWidget />
          <Vlibras />
        </>
      )}
    </>
  );
}
