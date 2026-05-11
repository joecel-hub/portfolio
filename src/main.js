import './styles/style.css'
import { initLoader } from './js/modules/loader.js'
import { initThreeBg } from './js/modules/three-bg.js'
import { initCursor } from './js/modules/cursor.js'
import { initBlob } from './js/modules/blob.js'
import { initModeToggle } from './js/modules/mode-toggle.js'
import { initNavigation } from './js/modules/navigation.js'
import { initAnimations } from './js/modules/animations.js'
import { initPhotoEffect } from './js/modules/photo-effect.js'
import { initHelpers } from './js/utils/helpers.js'

document.addEventListener('DOMContentLoaded', () => {
  initThreeBg()
  initCursor()
  initBlob()
  initModeToggle()
  initNavigation()
  initPhotoEffect()
  initHelpers()
  initLoader(() => {
    initAnimations()
  })
})
