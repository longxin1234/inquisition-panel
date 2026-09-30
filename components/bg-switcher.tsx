"use client"
import React, { useState } from "react"
import AuroraBg from "@/components/aurora-bg"
import BgStars from "@/components/bg-stars"

const bgList = [
  { key: "aurora", name: "极光", Comp: AuroraBg },
  { key: "stars", name: "星空", Comp: BgStars },
]

export default function BgSwitcher() {
  const [bg, setBg] = useState("aurora")
  const BgComp = bgList.find((b) => b.key === bg)?.Comp || AuroraBg
  return (
    <>
      <BgComp />
      <div className="fixed left-4 top-4 z-50">
        <div className="flex gap-2 bg-black/40 backdrop-blur px-3 py-2 rounded-full shadow-lg border border-cyan-400/30">
          {bgList.map((item) => (
            <button
              key={item.key}
              className={`px-3 py-1 rounded-full text-sm font-bold transition-all duration-150 border-2 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 ${bg === item.key ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-white border-cyan-400 shadow" : "bg-transparent text-cyan-200 border-transparent hover:bg-cyan-400/20"}`}
              onClick={() => setBg(item.key)}
              type="button"
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>
    </>
  )
} 