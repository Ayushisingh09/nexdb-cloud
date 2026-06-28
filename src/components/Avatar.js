'use client';
import { useState, useEffect } from 'react';

// Gravatar now supports SHA-256 hashes, which the browser's SubtleCrypto can compute natively.
async function sha256Hex(input) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Avatar resolves a Gravatar image from the user's email and gracefully falls
 * back to a gradient initial when no Gravatar exists (d=404 → onError).
 */
export default function Avatar({ name, email, size = 36, className = '', showStatus = false }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);
  const initial = name?.charAt(0)?.toUpperCase() || 'U';

  useEffect(() => {
    let active = true;
    setFailed(false);
    setUrl(null);
    if (!email || typeof crypto === 'undefined' || !crypto.subtle) return;
    sha256Hex(email.trim().toLowerCase())
      .then(hash => {
        if (active) setUrl(`https://www.gravatar.com/avatar/${hash}?s=${Math.round(size * 2)}&d=404`);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [email, size]);

  const showImg = url && !failed;
  const fontSize = Math.max(11, Math.round(size * 0.4));

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <div className="w-full h-full rounded-full overflow-hidden ring-1 ring-white/10">
        {showImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={name || 'User'}
            onError={() => setFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--info)] flex items-center justify-center font-bold text-[var(--bg-primary)]"
            style={{ fontSize }}
          >
            {initial}
          </div>
        )}
      </div>
      {showStatus && (
        <span
          className="absolute -bottom-0.5 -right-0.5 bg-[var(--success)] border-2 border-[var(--bg-secondary)] rounded-full"
          style={{ width: Math.max(8, size * 0.28), height: Math.max(8, size * 0.28) }}
        />
      )}
    </div>
  );
}
