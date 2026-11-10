import { useEffect, useState } from 'react';
import { store } from './store';

export function useStoreState() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => {
      setTick((prev) => prev + 1);
    };

    store.addEventListener('change', handleUpdate);
    return () => {
      store.removeEventListener('change', handleUpdate);
    };
  }, []);

  return {
    currentUser: store.getCurrentUser(),
    store,
    version: tick,
  };
}
