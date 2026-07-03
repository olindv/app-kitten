import { useEffect, useState } from 'react';

import { useNeedsStore } from './needsStore';
import { useProfileStore } from './profileStore';
import { useProgressStore } from './progressStore';

const allHydrated = () =>
  useProfileStore.persist.hasHydrated() &&
  useNeedsStore.persist.hasHydrated() &&
  useProgressStore.persist.hasHydrated();

// true, когда все persist-сторы загрузились из AsyncStorage.
// До этого показывается сплэш — иначе мигнёт экран создания у существующего игрока.
export function useHydration(): boolean {
  const [hydrated, setHydrated] = useState(allHydrated);

  useEffect(() => {
    const check = () => setHydrated(allHydrated());
    const unsubs = [
      useProfileStore.persist.onFinishHydration(check),
      useNeedsStore.persist.onFinishHydration(check),
      useProgressStore.persist.onFinishHydration(check),
    ];
    check();
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  return hydrated;
}
