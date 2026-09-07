import gsap from 'gsap'

export function initTextType(container, options = {}) {
  const {
    words = [],
    typingSpeed = 60,
    deletingSpeed = 30,
    pauseDuration = 2000,
    initialDelay = 500,
    loop = true
  } = options

  if (!container || words.length === 0) return

  const textNode = document.createTextNode('')
  container.appendChild(textNode)

  const cursor = document.createElement('span')
  cursor.className = 'type-cursor'
  cursor.textContent = '|'
  container.appendChild(cursor)

  gsap.set(cursor, { opacity: 1 })
  gsap.to(cursor, {
    opacity: 0,
    duration: 0.6,
    repeat: -1,
    yoyo: true,
    ease: 'steps(1)'
  })

  let currentWordIndex = 0
  let displayedText = ''
  let isDeleting = false
  let charIndex = 0
  let timeout

  function getCurrentWord() {
    return words[currentWordIndex]
  }

  function type() {
    const word = getCurrentWord()

    if (isDeleting) {
      if (displayedText === '') {
        isDeleting = false
        charIndex = 0
        currentWordIndex = (currentWordIndex + 1) % words.length
        if (currentWordIndex === 0 && !loop) return
        timeout = setTimeout(type, pauseDuration)
      } else {
        displayedText = displayedText.slice(0, -1)
        textNode.nodeValue = displayedText
        timeout = setTimeout(type, deletingSpeed)
      }
    } else {
      if (charIndex < word.length) {
        displayedText += word[charIndex]
        textNode.nodeValue = displayedText
        charIndex++
        timeout = setTimeout(type, typingSpeed)
      } else if (words.length >= 1) {
        if (!loop && currentWordIndex === words.length - 1) return
        timeout = setTimeout(() => {
          isDeleting = true
          type()
        }, pauseDuration)
      }
    }
  }

  timeout = setTimeout(type, initialDelay)

  function destroy() {
    if (timeout) clearTimeout(timeout)
    if (cursor && cursor.parentElement) cursor.remove()
  }

  return { destroy }
}
