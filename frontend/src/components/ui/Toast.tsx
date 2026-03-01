import { Toaster, type ToasterProps } from 'react-hot-toast';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const TOAST_OPTIONS: ToasterProps['toastOptions'] = {
  duration: 3500,
  style: {
    background: '#1c1a17',
    color: '#faf7f2',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: 500,
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)',
    maxWidth: '380px',
    lineHeight: '1.4',
  },
  success: {
    iconTheme: { primary: '#a67c5d', secondary: '#faf7f2' },
    icon: <CheckCircleIcon className="w-5 h-5 text-cream-500 flex-shrink-0" />,
  },
  error: {
    iconTheme: { primary: '#ef4444', secondary: '#faf7f2' },
    icon: <XCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />,
  },
};

export function AppToaster() {
  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      <Toaster
        position="bottom-right"
        gutter={8}
        toastOptions={TOAST_OPTIONS}
        containerStyle={{ bottom: 24, right: 24 }}
      />
    </div>
  );
}
