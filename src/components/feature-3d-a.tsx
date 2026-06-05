"use client";

import type { CSSProperties } from "react";

type AColor = { color?: string };

function aSceneStyle(color: string): CSSProperties {
  return { "--a-color": color } as CSSProperties;
}

export function AFileUpload({ color = "#F26522" }: AColor) {
  return (
    <div className="A-scene" style={aSceneStyle(color)}>
      <div className="A-file">
        <div className="A-chevron" />
        <div className="A-waveform">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}

export function ATranscription({ color = "#F26522" }: AColor) {
  return (
    <div className="A-scene" style={aSceneStyle(color)}>
      <div className="A-trans">
        <div className="bars">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="timeline" />
        <div className="chars">
          <span>T</span>
          <span>h</span>
          <span>e</span>
          <span> </span>
        </div>
      </div>
    </div>
  );
}

export function ASummarization({ color = "#F26522" }: AColor) {
  return (
    <div className="A-scene" style={aSceneStyle(color)}>
      <div className="A-sum">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

export function ASearch({ color = "#F26522" }: AColor) {
  const rows = [
    "10:14 Acme discov...",
    "10:02 Acme discov...",
    "09:48 Acme discov...",
    "09:30 Acme discov...",
    "09:12 Acme discov...",
    "08:55 Acme discov...",
  ];
  return (
    <div className="A-scene" style={aSceneStyle(color)}>
      <div className="A-search">
        <div className="lens" />
        {rows.map((text, i) => (
          <div key={i} className={i === 2 ? "row hi" : "row"}>
            <i />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ALocal({ color = "#F26522" }: AColor) {
  return (
    <div className="A-scene" style={aSceneStyle(color)}>
      <div className="A-local">
        <div className="ring r1" />
        <div className="ring r2" />
        <div className="ring r3" />
        <div className="laptop">
          <div className="screen" />
          <div className="base" />
        </div>
      </div>
    </div>
  );
}

export function ALang({ color = "#F26522" }: AColor) {
  const chars = ["A", "你", "ё", "ا", "あ"];
  const codes = ["EN", "EL", "RU", "AR", "ZH"];
  return (
    <div className="A-scene" style={aSceneStyle(color)}>
      <div className="A-lang">
        <div className="char">
          {chars.map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </div>
        <div className="codes">
          {codes.map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
