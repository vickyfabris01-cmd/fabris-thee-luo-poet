import { useEffect, useState } from "react";

export function read(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error('read error', e);
    return fallback;
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Dispatch event so listeners know data changed
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('flp-data-updated', { detail: { key, value } }));
    }, 0);
  } catch (e) {
    console.error('write error', e);
  }
}

export function useLocalResource(key, fallback = null) {
  const [state, setState] = useState(() => read(key, fallback));

  useEffect(() => {
    // Listen for custom events from write() calls in same tab
    const onCustom = (ev) => {
      if (!ev?.detail) return;
      if (ev.detail.key === key) {
        console.log('Custom event received for', key, ev.detail.value);
        setState(ev.detail.value);
      }
    };
    
    // Listen for storage events from other tabs/windows
    const onStorage = (e) => {
      if (e.key !== key) return;
      try {
        if (e.newValue) {
          const newState = JSON.parse(e.newValue);
          console.log('Storage event received for', key, newState);
          setState(newState);
        } else {
          setState(fallback);
        }
      } catch (err) {
        console.error('storage event parse error', err);
        setState(fallback);
      }
    };

    window.addEventListener('flp-data-updated', onCustom);
    window.addEventListener('storage', onStorage);
    
    return () => {
      window.removeEventListener('flp-data-updated', onCustom);
      window.removeEventListener('storage', onStorage);
    };
  }, [key, fallback]);

  const setter = (v) => write(key, v);
  return [state, setter];
}
