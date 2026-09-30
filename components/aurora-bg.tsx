"use client"
import React from "react"

export default function AuroraBg() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{}}
    >
      <div className="absolute left-1/2 top-1/3 w-[120vw] h-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-sky-300 via-blue-500 to-cyan-500 opacity-35 blur-3xl animate-aurora-move" />
      <div className="absolute left-1/3 top-2/3 w-[80vw] h-[40vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-white via-cyan-300 to-blue-500 opacity-25 blur-2xl animate-aurora-move2" />
      <div className="absolute left-2/3 top-1/4 w-[60vw] h-[30vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-white/60 via-cyan-200/40 to-transparent opacity-20 blur-2xl animate-aurora-move3" />
      <style jsx global>{`
        @keyframes aurora-move {
          0% { transform: translate(-50%, -50%) scale(1) rotate(0deg);}
          50% { transform: translate(-48%, -52%) scale(1.08) rotate(8deg);}
          100% { transform: translate(-50%, -50%) scale(1) rotate(0deg);}
        }
        @keyframes aurora-move2 {
          0% { transform: translate(-50%, -50%) scale(1) rotate(0deg);}
          50% { transform: translate(-52%, -48%) scale(1.12) rotate(-10deg);}
          100% { transform: translate(-50%, -50%) scale(1) rotate(0deg);}
        }
        @keyframes aurora-move3 {
          0% { transform: translate(-50%, -50%) scale(1) rotate(0deg);}
          50% { transform: translate(-49%, -51%) scale(1.05) rotate(12deg);}
          100% { transform: translate(-50%, -50%) scale(1) rotate(0deg);}
        }
        .animate-aurora-move {
          animation: aurora-move 12s ease-in-out infinite alternate;
        }
        .animate-aurora-move2 {
          animation: aurora-move2 16s ease-in-out infinite alternate;
        }
        .animate-aurora-move3 {
          animation: aurora-move3 20s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  )
} 
