'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { baseURL } from '@/lib/api';

export function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/_next')) return;

    const bucket = Math.floor(Date.now() / 60000);
    const key = `rg:visit:${pathname}:${bucket}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    const timer = setTimeout(() => {
      fetch(`${baseURL}/visitors/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: pathname }),
        keepalive: true,
      }).catch(() => {
        sessionStorage.removeItem(key);
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
