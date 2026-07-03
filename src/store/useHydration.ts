import { useEffect, useState } from 'react';

import { useNeedsStore } from './needsStore';
import { useProfileStore } from './profileStore';

const bothHydrated = () =>
  useProfileStore.persist.hasHydrated() && useNeedsStore.persist.hasHydrated();

// true, когда оба persist-стора загрузились из AsyncStorage.
// До этого показывается сплэш — иначе мигнёт экран создания у существующего игрока.
export function useHydration(): boolean {
  const [hydrated, setHydrated] = useState(bothHydrated);

  useEffect(() => {
    const check = () => setHydrated(bothHydrated());
    const unsubs = [
      useProfileStore.persist.onFinishHydration(check),
      useNeedsStore.persist.onFinishHydration(check),
    ];
    check();
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  return hydrated;
}
