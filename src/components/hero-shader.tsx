"use client";

import { Shader, Swirl, ChromaFlow, FlutedGlass, FilmGrain } from "shaders/react";

export default function HeroShader() {
  return (
    <Shader
      style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }}
      colorSpace="srgb"
      toneMapping="neutral"
    >
      <Swirl colorA="#ffffff" colorB="#f0f0f0" detail={1.7} />
      <ChromaFlow
        baseColor="#ffffff"
        downColor="#ff5f03"
        leftColor="#ff5f03"
        rightColor="#ff5f03"
        upColor="#ff5f03"
        momentum={13}
        radius={3.5}
      />
      <FlutedGlass
        aberration={0.61}
        angle={31}
        frequency={8}
        highlight={0.12}
        highlightSoftness={0}
        lightAngle={-90}
        refraction={4}
        shape="rounded"
        softness={1}
        speed={0.15}
      />
      <FilmGrain strength={0.05} />
    </Shader>
  );
}
