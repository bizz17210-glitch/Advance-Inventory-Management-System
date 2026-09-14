import { useState, useRef, useCallback } from "react";

interface UsePageLoadingReturn {
  isLoading: boolean;
  loadingProgress: number;
  showShimmer: boolean;
  startLoading: (onComplete?: () => void, delay?: number) => void;
  stopLoading: () => void;
}

export const usePageLoading = (): UsePageLoadingReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showShimmer, setShowShimmer] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopLoading = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setLoadingProgress(100);
    setTimeout(() => {
      setIsLoading(false);
      setLoadingProgress(0);
      setTimeout(() => setShowShimmer(false), 300);
    }, 200);
  }, []);

  const startLoading = useCallback(
    (onComplete?: () => void, delay?: number) => {
      if (intervalRef.current) clearInterval(intervalRef.current);

      setIsLoading(true);
      setShowShimmer(true);
      setLoadingProgress(0);

      intervalRef.current = setInterval(() => {
        setLoadingProgress((prev) => {
          const next = prev + Math.random() * 15;
          return next > 90 ? 90 : next;
        });
      }, 120);

      const delays = [500, 1000, 1500];
      const randomDelay =
        delay ?? delays[Math.floor(Math.random() * delays.length)];

      setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setLoadingProgress(100);
        onComplete?.();
        setTimeout(() => {
          setIsLoading(false);
          setLoadingProgress(0);
          setTimeout(() => setShowShimmer(false), 300);
        }, 200);
      }, randomDelay);
    },
    [],
  );

  return { isLoading, loadingProgress, showShimmer, startLoading, stopLoading };
};
