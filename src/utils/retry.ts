export const retry =
  <P extends any[], R extends Promise<any>>(fn: (...args: P) => R, times: number, logError?: (error: any, ...args: P) => void) =>
  async (...args: P) => {
    const send = async (retry: number) => {
      try {
        return await fn(...args);
      } catch (error) {
        if (retry <= 0) {
          throw error;
        }
        logError?.(error, ...args);
        return send(retry - 1);
      }
    };
    return send(times);
  };
