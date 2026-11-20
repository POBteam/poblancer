'use client';

export default function CookiePreferenceButton({
  className = 'button primary',
  label = 'Manage Cookie Preferences'
}: {
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent('poblancer:open-cookie-preferences'))}
    >
      {label}
    </button>
  );
}
