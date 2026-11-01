// Honest plan-fact stats — every number matches src/lib/plans.ts
// (free 300 min / pro 1200 min + $9 + 5 seats / business $29 +
// unlimited + 240-min calls). No invented quotes, no testimonials.
import type { CSSProperties, ElementType } from "react";

type StatInstr =
  | { value: string; label: string; color: "o" | "g"; sub: string; instrument: true; seats?: false; chain?: false }
  | { value: string; label: string; color: "o" | "g"; sub: string; seats: true; instrument?: false; chain?: false }
  | { value: string; label: string; color: "o" | "g"; sub: string; chain: true; instrument?: false; seats?: false };

const stats: StatInstr[] = [
  {
    value: "300",
    label: "Free minutes/mo — no card required",
    color: "o",
    sub: "No card required",
    instrument: true,
  },
  {
    value: "1,200",
    label: "Pro minutes/mo — flat $9, 5 seats",
    color: "g",
    sub: "Flat $9 · 5 seats",
    seats: true,
  },
  {
    value: "$29",
    label: "Business flat — unlimited seats",
    color: "o",
    sub: "Unlimited seats",
    instrument: true,
  },
  {
    value: "4h",
    label: "Business call limit — 90 min on Pro",
    color: "g",
    sub: "90 min on Pro",
    chain: true,
  },
];

type Seg = {
  title: string;
  kind: string;
  tokens: { label: string; hot?: boolean; grn?: boolean }[];
  scene: "solo" | "ops" | "manager";
  sceneLabel: string;
};

const segments: Seg[] = [
  {
    title: "Solo SDRs",
    kind: "Solo",
    tokens: [
      { label: "Next call queued", hot: true },
      { label: "CRM-ready" },
      { label: "Start free", grn: true },
    ],
    scene: "solo",
    sceneLabel: "Rep queue — notes done, logged, next up",
  },
  {
    title: "RevOps teams",
    kind: "Ops",
    tokens: [
      { label: "Pipeline fill", hot: true },
      { label: "Consistent f/u" },
      { label: "CRM exports", grn: true },
    ],
    scene: "ops",
    sceneLabel: "Deal data — CRM fields filled and syncing",
  },
  {
    title: "Sales managers",
    kind: "Manager",
    tokens: [
      { label: "Talk ratio", hot: true },
      { label: "Sentiment" },
      { label: "Coach from data", grn: true },
    ],
    scene: "manager",
    sceneLabel: "Talk ratio meter with a flagged coaching moment",
  },
];

/* fps scenes — static wide-plate lookalikes of the Batch A console
   scenes (no animation → no pause story needed on a server component). */

function FpsSceneSolo() {
  return (
    <>
      <span className="fps-scap">Rep queue</span>
      <div className="fps-sbody">
        <div className="fps-srow">
          <span className="fps-sdot fps-sdot--o" aria-hidden="true" />
          <span className="fps-sbar" style={{ width: "58%" }} aria-hidden="true" />
          <span className="fps-tag">Notes done</span>
        </div>
        <div className="fps-srow">
          <span className="fps-sdot fps-sdot--g" aria-hidden="true" />
          <span className="fps-sbar" style={{ width: "44%" }} aria-hidden="true" />
          <span className="fps-tag">Logged</span>
        </div>
        <div className="fps-srow">
          <span className="fps-sdot fps-sdot--bl" aria-hidden="true" />
          <span className="fps-sbar" style={{ width: "52%" }} aria-hidden="true" />
          <span className="fps-tag">Next up</span>
        </div>
      </div>
    </>
  );
}

function FpsSceneOps() {
  return (
    <>
      <span className="fps-scap">Deal data</span>
      <div className="fps-sbody">
        <div className="fps-srow">
          <span className="fps-sdot fps-sdot--g" aria-hidden="true" />
          <span className="fps-sbar" style={{ width: "64%" }} aria-hidden="true" />
          <span className="fps-tag">Filled</span>
        </div>
        <div className="fps-srow">
          <span className="fps-sdot fps-sdot--g" aria-hidden="true" />
          <span className="fps-sbar" style={{ width: "50%" }} aria-hidden="true" />
          <span className="fps-tag">Filled</span>
        </div>
        <div className="fps-srow">
          <span className="fps-sdot fps-sdot--o" aria-hidden="true" />
          <span className="fps-sbar" style={{ width: "36%" }} aria-hidden="true" />
          <span className="fps-tag">Syncing</span>
        </div>
      </div>
    </>
  );
}

function FpsSceneManager() {
  return (
    <>
      <span className="fps-scap">Coaching peek</span>
      <div className="fps-sbody">
        <div className="fps-meterrow">
          <span>Rep 62%</span>
          <span className="fps-mtrack" aria-hidden="true">
            <b className="fps-mtrack--o" />
            <b className="fps-mtrack--b" />
          </span>
          <span>Buyer 38%</span>
        </div>
        <span className="fps-coachchip">
          <b aria-hidden="true" />
          Coaching moment · 14:22 pricing objection
        </span>
      </div>
    </>
  );
}

const FPS_SCENES: Record<Seg["scene"], ElementType> = {
  solo: FpsSceneSolo,
  ops: FpsSceneOps,
  manager: FpsSceneManager,
};

/* Instrument-track bar heights per instrument cell (`.fst-instrument i`
   reads `height: var(--h)`, so the var is required inline — mirrors the
   Batch A ribbon). off = greyed, unlit bar. */
const BARS_INSTRUMENT: Record<string, { h: string; off?: boolean }[]> = {
  "300": [
    { h: "6px", off: true },
    { h: "9px", off: true },
    { h: "14px" },
    { h: "11px" },
    { h: "7px", off: true },
    { h: "13px" },
    { h: "9px" },
  ],
  "$29": [
    { h: "8px", off: true },
    { h: "12px", off: true },
    { h: "10px" },
    { h: "14px" },
    { h: "6px", off: true },
    { h: "11px" },
    { h: "9px" },
  ],
};

export default function PricingSocialProof() {
  return (
    <section className="pb-20 px-5 sm:px-8 lg:px-12">
      <div className="max-w-[1440px] mx-auto">
        <div className="fps-band py-14 sm:py-16 px-5 sm:px-8 lg:px-12">
          <div className="fps-grain" aria-hidden="true" />
          <div className="max-w-[1300px] mx-auto relative">
            <header className="text-center mb-10">
              <p className="fpb-eyebrow mb-4">Built for revenue teams</p>
              <h3 className="fps-title">One tool across every seat</h3>
              <p className="fps-sub">
                Designed for the people who actually live in sales calls
              </p>
            </header>

            {/* plans.ts truth — ribbon cells reuse the Batch A fst geometry */}
            <div className="fst-rail">
              {stats.map((stat) => (
                <div key={stat.label} className="fst-cell">
                  <span
                    className={`fst-hero fst-hero--${stat.color}`}
                    aria-hidden="true"
                  />
                  <span className="fst-label">
                    <i
                      aria-hidden="true"
                      style={{ background: stat.color === "o" ? "#fb923c" : "#6ee7b7" }}
                    />
                    {stat.label}
                  </span>
                  <div className="fst-big">{stat.value}</div>
                  <div className="fst-sub">{stat.sub}</div>
                  {stat.instrument ? (
                    <div className="fst-instrument" aria-hidden="true">
                      {(BARS_INSTRUMENT[stat.value] ?? []).map((b, i) => (
                        <i
                          key={i}
                          className={b.off ? "fst-off" : undefined}
                          style={{ "--h": b.h } as CSSProperties}
                        />
                      ))}
                    </div>
                  ) : null}
                  {stat.seats ? (
                    <div className="fps-seats" aria-hidden="true">
                      <i className="fps-on" /><i className="fps-on" /><i className="fps-on" /><i className="fps-on" /><i className="fps-on" />
                    </div>
                  ) : null}
                  {stat.chain ? (
                    <div className="fst-chain" aria-hidden="true">
                      <i className="fst-on" /><s /><i className="fst-on" /><s />
                      <i className="fst-on" /><s /><i className="fst-on" /><s />
                      <i /><s /><i />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {/* persona plates: scenes instead of bullet walls */}
            <div className="fps-trio">
              {segments.map((seg) => {
                const Scene = FPS_SCENES[seg.scene];
                return (
                  <article key={seg.title} className="fps-pcard">
                    <p className="fps-prole"><b>Seat</b> · {seg.kind}</p>
                    <p className="fps-ptitle">{seg.title}</p>
                    <div className="fps-tokline">
                      {seg.tokens.map((t) => (
                        <span
                          key={t.label}
                          className={`fps-ptok${t.hot ? " fps-ptok--hot" : ""}${t.grn ? " fps-ptok--grn" : ""}`}
                        >
                          {t.label}
                        </span>
                      ))}
                    </div>
                    <div
                      className="fps-scene"
                      role="img"
                      aria-label={`${seg.title} — ${seg.sceneLabel}`}
                    >
                      <Scene />
                    </div>
                  </article>
                );
              })}
            </div>

            <p className="fps-disclaimer">
              Customer testimonials are coming as we collect real feedback. No fake quotes here.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
