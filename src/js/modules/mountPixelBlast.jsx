import React from 'react'
import { createRoot } from 'react-dom/client'
import PixelBlast from './PixelBlast'
import '../../styles/components/pixel-blast.css'

export function mountPixelBlast(container, options = {}) {
  const root = createRoot(container)
  root.render(
    <PixelBlast
      variant={options.variant || 'square'}
      pixelSize={options.pixelSize || 4}
      color={options.color || '#7c6eff'}
      patternScale={options.patternScale || 2}
      patternDensity={options.patternDensity || 0.8}
      enableRipples={options.enableRipples !== false}
      rippleIntensityScale={options.rippleIntensityScale || 0.5}
      speed={options.speed || 0.5}
      edgeFade={options.edgeFade || 0.3}
    />
  )

  return () => {
    root.unmount()
  }
}
