'use client'

import { useEffect } from 'react'

export function LandingMotion() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>('.public-page')
    if (!page || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const items = Array.from(page.querySelectorAll<HTMLElement>('[data-reveal]'))
    const visibleNow = (element: HTMLElement) => {
      const bounds = element.getBoundingClientRect()
      return bounds.top < window.innerHeight * 0.94 && bounds.bottom > 0
    }

    items.filter(visibleNow).forEach(element => element.classList.add('is-visible'))
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })

    items.filter(element => !element.classList.contains('is-visible')).forEach(element => observer.observe(element))
    page.classList.add('motion-ready')
    return () => { observer.disconnect(); page.classList.remove('motion-ready') }
  }, [])

  return null
}
