import React from 'react'
import { createRoot } from 'react-dom/client'
import SwipeStack from './SwipeStack'

export function mountSwipeStack(container, options = {}) {
  const root = createRoot(container)
  root.render(
    <SwipeStack
      cardWidth={options.cardWidth || 300}
      cardHeight={options.cardHeight || 420}
      cardRadius={options.cardRadius || 4}
      images={options.images}
      tiltAngle={options.tiltAngle || -45}
      xOffset={options.xOffset || 200}
    />
  )

  return () => root.unmount()
}
