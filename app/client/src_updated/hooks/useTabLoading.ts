import { usePageLoading } from "./usePageLoading";

/**
 * Drop-in hook for any page with tabs.
 * Usage:
 *   const { isLoading, loadingProgress, switchTab } = useTabLoading(setActiveTab);
 *   <TopLoadingBar progress={loadingProgress} isLoading={isLoading} />
 *   onClick={() => switchTab(tab.id)}
 */
export function useTabLoading<T>(setTab: (tab: T) => void, currentTab?: T) {
  const { isLoading, loadingProgress, startLoading } = usePageLoading();

  const switchTab = (newTab: T) => {
    if (newTab === currentTab) return; // already on this tab, skip
    startLoading(() => setTab(newTab));
  };

  return { isLoading, loadingProgress, switchTab };
}
