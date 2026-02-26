
'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// Carregamento dinâmico estrito para o cliente
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Regra para não renderizar os widgets em páginas de login/registro
  const isAuthPage = ['/login', '/register', '/'].includes(pathname);

  if (!mounted) return <>{children}</>;

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
