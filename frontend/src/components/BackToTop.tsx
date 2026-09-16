import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpIcon } from './Icons'

export function BackToTop({ containerRef }: { containerRef: RefObject<HTMLDivElement | null> }) {
  const [position, setPosition] = useState({ visible: false, left: 0 })

  useEffect(() => {
    let frame = 0
    const update = () => {
      const container = containerRef.current
      if (!container) return
      const rect = (container.closest('main') || container).getBoundingClientRect()
      let scrolled = window.scrollY > 240
      for (let element: HTMLElement | null = container; element; element = element.parentElement) {
        scrolled ||= element.scrollTop > 240
      }
      const left = (Math.max(0, rect.left) + Math.min(window.innerWidth, rect.right)) / 2
      setPosition((current) => current.visible === scrolled && current.left === left ? current : { visible: scrolled, left })
    }
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    const observer = new ResizeObserver(schedule)
    if (containerRef.current) observer.observe(containerRef.current)
    update()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
    }
  }, [containerRef])

  if (!position.visible) return null
  return createPortal(<button type="button" className="asset-back-to-top" style={{ left: position.left }} title="返回顶部" aria-label="返回顶部" onClick={() => {
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    for (let element: HTMLElement | null = containerRef.current; element; element = element.parentElement) {
      if (element.scrollTop > 0) element.scrollTo({ top: 0, behavior })
    }
    window.scrollTo({ top: 0, behavior })
  }}><ArrowUpIcon /></button>, document.body)
}
