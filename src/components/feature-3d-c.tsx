"use client"

const actItems = [
  { task: "Send pricing proposal to Acme", who: "JS", due: "Mon" },
  { task: "Schedule technical demo", who: "MR", due: "Wed" },
  { task: "Follow up on contract terms", who: "AT", due: "Fri" },
]

export function CAct() {
  return (
    <div className="w-full font-mono text-[10px] leading-tight">
      {actItems.map((item, i) => (
        <div
          key={i}
          className="grid grid-cols-[12px_1fr_auto] gap-1.5 items-center px-1.5 py-1 bg-white border border-gray-200 rounded mb-[3px]"
        >
          <span className="block w-2.5 h-2.5 border-[1.5px] border-[#F26522] rounded-[2px]" />
          <span className="text-[#0a0a0a] truncate">{item.task}</span>
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="px-1 py-px bg-[#F26522]/10 text-[#F26522] rounded-sm text-[8px] font-mono">
              {item.who}
            </span>
            <span className="text-gray-400 text-[8px] font-mono">{item.due}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

export function CHud() {
  return (
    <div className="grid grid-cols-2 gap-1 w-full font-mono text-[9px]">
      <div className="bg-[#fafafa] border border-gray-200 rounded p-1.5">
        <div className="text-gray-400 text-[7px] uppercase tracking-[0.1em] mb-1">
          Health
        </div>
        <div className="flex items-end gap-1.5">
          <div className="text-[16px] font-bold text-[#F26522] font-mono leading-none">
            8.4
          </div>
          <div
            className="w-10 h-2.5 rounded-t-full"
            style={{
              background:
                "linear-gradient(90deg, #F26522 0% 84%, #e5e5e5 84% 100%)",
            }}
          />
        </div>
      </div>
      <div className="bg-[#fafafa] border border-gray-200 rounded p-1.5">
        <div className="text-gray-400 text-[7px] uppercase tracking-[0.1em] mb-1">
          Talk Ratio
        </div>
        <div className="text-[#0a0a0a] text-[10px] font-mono leading-none">
          48 / 52
        </div>
        <div className="flex items-center gap-1 mt-1.5">
          <span
            className="h-1.5 rounded-sm bg-[#F26522] block"
            style={{ width: "48%" }}
          />
          <span
            className="h-1.5 rounded-sm bg-[#2563eb] block"
            style={{ width: "52%" }}
          />
        </div>
      </div>
      <div className="bg-[#fafafa] border border-gray-200 rounded p-1.5">
        <div className="text-gray-400 text-[7px] uppercase tracking-[0.1em] mb-1">
          Sentiment
        </div>
        <div className="text-[14px] font-bold text-[#0a0a0a] font-mono leading-none">
          +0.62
        </div>
        <div className="text-[#059669] text-[8px] mt-1 font-mono">
          ▲ 12% vs avg
        </div>
      </div>
      <div className="bg-[#fafafa] border border-gray-200 rounded p-1.5">
        <div className="text-gray-400 text-[7px] uppercase tracking-[0.1em] mb-1">
          Completion
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-[30px] h-[30px] rounded-full shrink-0"
            style={{
              background:
                "conic-gradient(#F26522 0deg 240deg, #e5e5e5 240deg 360deg)",
            }}
          />
          <div className="text-[12px] font-bold text-[#0a0a0a] font-mono">
            67%
          </div>
        </div>
      </div>
    </div>
  )
}

function PulseRow({ color, seed }: { color: string; seed: number }) {
  const bars = Array.from({ length: 42 })
  return (
    <div className="flex gap-px items-center h-[18px] mb-1 overflow-hidden">
      {bars.map((_, i) => {
        const phase = (i + seed) * 0.55
        const h = 35 + Math.sin(phase) * 30 + Math.cos(phase * 1.7) * 22
        const delay = ((i + seed * 3) % 10) * 0.05
        return (
          <span
            key={i}
            className="c-pulse-bar block rounded-[1px] shrink-0"
            style={{
              width: 2,
              height: `${Math.max(15, Math.min(100, h))}%`,
              background: color,
              animationDelay: `${delay}s`,
            }}
          />
        )
      })}
    </div>
  )
}

export function CSpeaker() {
  return (
    <div className="w-full font-mono text-[10px]">
      <PulseRow color="#F26522" seed={1} />
      <PulseRow color="#2563eb" seed={5} />
      <PulseRow color="#7c3aed" seed={9} />
      <div className="flex gap-2 text-gray-400 text-[8px] mt-1 font-mono">
        <span className="inline-flex items-center">
          <i className="inline-block w-1.5 h-1.5 rounded-full bg-[#F26522] mr-1" />
          Sarah
        </span>
        <span className="inline-flex items-center">
          <i className="inline-block w-1.5 h-1.5 rounded-full bg-[#2563eb] mr-1" />
          John
        </span>
        <span className="inline-flex items-center">
          <i className="inline-block w-1.5 h-1.5 rounded-full bg-[#7c3aed] mr-1" />
          Mia
        </span>
      </div>
    </div>
  )
}

export function CJson() {
  return (
    <pre className="w-full font-mono text-[10px] leading-[1.5] bg-[#1a1a1a] text-[#e5e5e5] p-2 rounded m-0 whitespace-pre overflow-hidden">
      <span>{"{"}</span>
      {"\n  "}
      <span className="text-[#79c0ff]">&quot;callId&quot;</span>
      <span>: </span>
      <span className="text-[#a5d6ff]">&quot;c_8x2k&quot;</span>
      <span>,</span>
      {"\n  "}
      <span className="text-[#79c0ff]">&quot;duration&quot;</span>
      <span>: </span>
      <span className="text-[#F26522]">1247</span>
      <span>,</span>
      {"\n  "}
      <span className="text-[#79c0ff]">&quot;speakers&quot;</span>
      <span>: </span>
      <span className="text-[#F26522]">2</span>
      <span>,</span>
      {"\n  "}
      <span className="text-[#79c0ff]">&quot;summary&quot;</span>
      <span>: </span>
      <span className="text-[#a5d6ff]">&quot;...&quot;</span>
      <span>,</span>
      {"\n  "}
      <span className="text-[#79c0ff]">&quot;actions&quot;</span>
      <span>: [</span>
      <span className="text-[#a5d6ff]">&quot;...&quot;</span>
      <span>]</span>
      {"\n"}
      <span>{"}"}</span>
    </pre>
  )
}

const teamData = [
  { initial: "S", name: "Sarah Chen", calls: 28, mins: 412, active: true },
  { initial: "J", name: "John Park", calls: 21, mins: 318, active: false },
  { initial: "M", name: "Mia Patel", calls: 19, mins: 287, active: false },
  { initial: "A", name: "Alex Kim", calls: 14, mins: 196, active: false },
]

export function CTeam() {
  return (
    <div className="w-full font-mono text-[10px]">
      {teamData.map((row, i) => (
        <div
          key={i}
          className="grid grid-cols-[20px_1fr_30px_30px] gap-1 py-0.5 items-center"
        >
          <span className="w-3.5 h-3.5 rounded-full bg-[#F26522] text-white flex items-center justify-center text-[7px] font-mono leading-none">
            {row.initial}
          </span>
          <span className="text-[#0a0a0a] truncate text-[10px]">{row.name}</span>
          <span
            className={`font-mono text-[10px] text-right ${row.active ? "text-[#F26522]" : "text-gray-400"}`}
          >
            {row.calls}
          </span>
          <span
            className={`font-mono text-[10px] text-right ${row.active ? "text-[#F26522]" : "text-gray-400"}`}
          >
            {row.mins}
          </span>
        </div>
      ))}
    </div>
  )
}
