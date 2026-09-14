import React, { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  getShaderColorFromString,
  liquidMetalFragmentShader,
  LiquidMetalShapes,
  ShaderFitOptions,
  ShaderMount,
} from "@paper-design/shaders";
import "./LiquidMetalButton.css";

type LiquidMetalButtonProps = {
  children: React.ReactNode;
  className?: string;
  icon?: string;
  to?: string;
  href?: string;
  colorBack?: string;
  colorTint?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
};

export const LiquidMetalButton: React.FC<LiquidMetalButtonProps> = ({
  children,
  className = "",
  icon,
  to,
  href,
  colorBack = "#111827",
  colorTint = "#f97316",
  onClick,
}) => {
  const shaderRef = useRef<HTMLSpanElement | null>(null);

  const uniforms = useMemo(
    () => ({
      u_colorBack: getShaderColorFromString(colorBack),
      u_colorTint: getShaderColorFromString(colorTint),
      u_image: undefined,
      u_repetition: 4.6,
      u_shiftRed: 0.22,
      u_shiftBlue: -0.18,
      u_contour: 0.72,
      u_softness: 0.48,
      u_distortion: 0.68,
      u_angle: 28,
      u_shape: LiquidMetalShapes.metaballs,
      u_isImage: false,
      u_fit: ShaderFitOptions.cover,
      u_scale: 1.75,
      u_rotation: 0,
      u_originX: 0.5,
      u_originY: 0.5,
      u_offsetX: 0,
      u_offsetY: 0,
      u_worldWidth: 360,
      u_worldHeight: 120,
    }),
    [colorBack, colorTint],
  );

  useEffect(() => {
    if (!shaderRef.current) return;

    let mount: ShaderMount | null = null;

    try {
      mount = new ShaderMount(
        shaderRef.current,
        liquidMetalFragmentShader,
        uniforms,
        { alpha: true, antialias: true, premultipliedAlpha: false },
        0.55,
        0,
        1.5,
      );
    } catch {
      mount = null;
    }

    return () => {
      mount?.dispose();
    };
  }, [uniforms]);

  const classes = `liquid-metal-button ${className}`.trim();
  const content = (
    <>
      <span
        className="liquid-metal-button__shader"
        ref={shaderRef}
        aria-hidden="true"
      />
      {icon && <i className={icon} aria-hidden="true" />}
      <span>{children}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" className={classes} onClick={onClick}>
      {content}
    </button>
  );
};
