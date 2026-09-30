"use client"
import React, { useEffect, useRef } from "react"

export default function BgStars() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let width = window.innerWidth
    let height = window.innerHeight
    let animationId: number
    canvas.width = width
    canvas.height = height

    const STAR_NUM = Math.floor((width * height) / 1800)
    const stars = Array.from({ length: STAR_NUM }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.2 + 0.3,
      speed: Math.random() * 0.08 + 0.02,
      alpha: Math.random() * 0.5 + 0.5,
    }))

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height)
      for (const star of stars) {
        ctx.save()
        ctx.globalAlpha = star.alpha
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.r, 0, 2 * Math.PI)
        ctx.fillStyle = "#fff"
        ctx.shadowColor = "#a5f3fc"
        ctx.shadowBlur = 8
        ctx.fill()
        ctx.restore()
        star.x += star.speed
        if (star.x > width + 2) star.x = -2
      }
      animationId = requestAnimationFrame(draw)
    }
    draw()

    function handleResize() {
      width = window.innerWidth
      height = window.innerHeight
      if (!canvas) return;
      canvas.width = width
      canvas.height = height
    }
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 w-full h-full bg-transparent"
      style={{}}
    />
  )
} 