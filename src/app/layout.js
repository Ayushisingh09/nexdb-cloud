'use client';
import { useEffect, useState } from 'react';
import './globals.css';

export default function RootLayout({ children }) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  return (
    <html lang="en" className="dark">
      <head>
        <title>NexDb Cloud — Managed Document Database</title>
        <meta name="description" content="Free NexDb database instances with connection strings for your projects." />
      </head>
      <body className="antialiased">{hydrated ? children : null}</body>
    </html>
  );
}
