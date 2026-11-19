export const createTtlCache = ({ max = 200, ttlMs }) => {
  const entries = new Map();
  return {
    get(key) {
      const hit = entries.get(key);
      if (!hit) return undefined;
      if (Date.now() > hit.expires) {
        entries.delete(key);
        return undefined;
      }
      entries.delete(key);
      entries.set(key, hit);
      return hit.value;
    },
    set(key, value) {
      entries.delete(key);
      entries.set(key, { value, expires: Date.now() + ttlMs });
      while (entries.size > max) entries.delete(entries.keys().next().value);
    },
  };
};
