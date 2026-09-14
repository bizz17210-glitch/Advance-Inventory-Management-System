import React, { useMemo } from "react";
import Lottie from "lottie-react";
import LoadingAnimation from "../../assets/loading/lottie_loading.json";
import "./TopLoadingBar.css";

interface TopLoadingBarProps {
  progress: number; // 0–100
  isLoading: boolean;
}

// Swap the black stroke color in the Lottie JSON to match --accent (#F97316)
const tintedAnimation = (() => {
  const json = JSON.parse(JSON.stringify(LoadingAnimation));
  const accentRgb = [0.976, 0.451, 0.086]; // #F97316 → r/g/b 0–1
  const recolor = (obj: any) => {
    if (!obj || typeof obj !== "object") return;
    if (obj.ty === "st" && obj.c?.k) {
      // solid color keyframe [r, g, b, a]
      if (Array.isArray(obj.c.k) && typeof obj.c.k[0] === "number") {
        obj.c.k = [...accentRgb, 1];
      }
    }
    Object.values(obj).forEach(recolor);
  };
  recolor(json);
  return json;
})();

const TopLoadingBar: React.FC<TopLoadingBarProps> = ({
  progress,
  isLoading,
}) => {
  return (
    <>
      {/* ── Thin progress bar at very top of screen ── */}
      <div id="topLoadingBarWrap" className={isLoading ? "active" : ""}>
        <div id="loadingBar" style={{ width: `${progress}%` }} />
      </div>

      {/* ── Lottie spinner — centered on page while loading ── */}
      {isLoading && (
        <div id="lottieLoadingOverlay">
          <div id="lottieLoadingBox">
            <Lottie
              animationData={tintedAnimation}
              loop={true}
              autoplay={true}
              style={{ width: 72, height: 72 }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default TopLoadingBar;
