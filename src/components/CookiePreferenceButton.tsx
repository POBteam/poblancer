'use client';
import type React from 'react';

export default function CookiePreferenceButton({
  className = 'button primary',
  label = 'Manage Cookie Preferences',
  style
}: {
  className?: string;
  label?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={() => window.dispatchEvent(new CustomEvent('poblancer:open-cookie-preferences'))}
    >
      {label}
    </button>
  );
}
