import { useCallback, useEffect, useState } from 'react';
import { ALL_LAYERS, LAYERS_STORAGE_KEY } from './live-map.types';
import type { LayerId } from './live-map.types';

interface MapLayersState {
  active: LayerId[];
  isOn: (id: LayerId) => boolean;
  toggle: (id: LayerId) => void;
  reset: () => void;
  hiddenCount: number;
}

/**
 * Layer visibility, split out of the map's connection state because the two
 * change for completely unrelated reasons and would otherwise re-render each
 * other. Persisted so the control panel (screen 018) and the map agree.
 */
export function useMapLayers(): MapLayersState {
  const [active, setActive] = useState<LayerId[]>(() => {
    try {
      const raw = localStorage.getItem(LAYERS_STORAGE_KEY);
      if (!raw) return ALL_LAYERS;
      const parsed = JSON.parse(raw) as { layers?: LayerId[] };
      // Only keep values we still recognise, so an old saved set cannot
      // resurrect a layer that no longer exists.
      const kept = (parsed.layers ?? []).filter((id) => ALL_LAYERS.includes(id));
      return kept.length > 0 ? kept : ALL_LAYERS;
    } catch {
      return ALL_LAYERS;
    }
  });

  useEffect(() => {
    const existing = (() => {
      try {
        return JSON.parse(localStorage.getItem(LAYERS_STORAGE_KEY) ?? '{}') as Record<string, unknown>;
      } catch {
        return {};
      }
    })();
    localStorage.setItem(LAYERS_STORAGE_KEY, JSON.stringify({ ...existing, layers: active }));
  }, [active]);

  const toggle = useCallback((id: LayerId) => {
    setActive((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }, []);

  return {
    active,
    isOn: useCallback((id: LayerId) => active.includes(id), [active]),
    toggle,
    reset: useCallback(() => setActive(ALL_LAYERS), []),
    hiddenCount: ALL_LAYERS.length - active.length,
  };
}
