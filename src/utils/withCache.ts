export const withCache = <P extends any[], R extends Promise<any>>(fn: (...args: P) => R, time: number) => {
  let cache: R | null = null;
  const clearCache = () => (cache = null);
  return (...args: P) => {
    if (!cache) {
      cache = fn(...args);
      cache
        .then((res) => {
          if (res) {
            setTimeout(clearCache, time);
          } else {
            clearCache();
          }
          return res;
        })
        .catch(() => {});
    }
    return cache;
  };
};
