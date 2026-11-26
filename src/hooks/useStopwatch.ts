import { useEffect, useRef, useState } from 'react';

type Status = 'idle' | 'running' | 'paused';

/**
 * Timestamp-based stopwatch: elapsed time is derived from Date.now(), so it
 * stays accurate even if ticks are delayed (e.g. app in background).
 */
export function useStopwatch(tickMs = 250) {
  const [status, setStatus] = useState<Status>('idle');
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number | null>(null);
  const accumulated = useRef(0);

  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => {
      if (startedAt.current != null) {
        setElapsed(accumulated.current + Date.now() - startedAt.current);
      }
    }, tickMs);
    return () => clearInterval(id);
  }, [status, tickMs]);

  const start = () => {
    startedAt.current = Date.now();
    setStatus('running');
  };

  const pause = () => {
    if (startedAt.current != null) {
      accumulated.current += Date.now() - startedAt.current;
      startedAt.current = null;
    }
    setElapsed(accumulated.current);
    setStatus('paused');
  };

  const reset = () => {
    startedAt.current = null;
    accumulated.current = 0;
    setElapsed(0);
    setStatus('idle');
  };

  return { status, elapsed, start, pause, resume: start, reset };
}
