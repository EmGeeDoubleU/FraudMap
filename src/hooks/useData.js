import { useState, useEffect } from 'react';

const cache = {};

export function useData(filename) {
  const [data, setData] = useState(cache[filename] ?? null);
  const [loading, setLoading] = useState(!cache[filename]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cache[filename]) {
      setData(cache[filename]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/data/${filename}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${filename}`);
        return res.json();
      })
      .then((json) => {
        cache[filename] = json;
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [filename]);

  return { data, loading, error };
}
