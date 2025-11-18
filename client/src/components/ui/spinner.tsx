import React from 'react';

export function Spinner({ size = 'md' }: { size?: 'sm'|'md'|'lg' }) {
  const dims = size === 'sm' ? 12 : size === 'lg' ? 28 : 20;
  return (
    <svg className="animate-spin" width={dims} height={dims} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
