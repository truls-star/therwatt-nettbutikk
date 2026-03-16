import { useEffect, useState } from 'react';

type ToastProps = {
  message: string;
  visible: boolean;
  onDone: () => void;
  duration?: number;
};

export function Toast({ message, visible, onDone, duration = 2000 }: ToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onDone();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDone]);

  if (!show) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}
