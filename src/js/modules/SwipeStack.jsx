import React, { useState } from "react"
import { motion } from "framer-motion"

// Only real photos of Gio live here — no third-party placeholder images.
const DEFAULT_IMAGES = [
  { src: "/images/normal.jpeg" },
  { src: "/images/wacky-pose.png" },
]

export default function SwipeStack({
  images = DEFAULT_IMAGES,
  cardWidth = 280,
  cardHeight = 380,
  cardRadius = 4,
  swipeThreshold = 50,
  tiltAngle = -45,
  tiltAngleStart = 0,
  xOffset = 200,
  transition = { type: "spring", stiffness: 300, damping: 30 },
  style,
}) {
  const imgs = Array.isArray(images) && images.length > 0 ? images : DEFAULT_IMAGES
  const actualCardCount = imgs.length > 0 ? imgs.length : 3

  const [cards, setCards] = useState(() =>
    Array.from({ length: actualCardCount }, (_, i) => ({
      id: i + 1,
      content: `Card ${i + 1}`,
      imageIndex: i,
    }))
  )

  const [isPressed, setIsPressed] = useState(false)
  const [shouldReturnToCenter, setShouldReturnToCenter] = useState(false)

  React.useEffect(() => {
    setCards((prevCards) => {
      if (prevCards.length !== actualCardCount) {
        return Array.from({ length: actualCardCount }, (_, i) => ({
          id: i + 1,
          content: `Card ${i + 1}`,
          imageIndex: i,
        }))
      }
      return prevCards
    })
  }, [actualCardCount])

  const handlePointerDown = () => setIsPressed(true)
  const handlePointerUp = () => setIsPressed(false)

  const handleDragEnd = (info) => {
    setIsPressed(false)
    const { offset } = info
    const distance = Math.sqrt(offset.x * offset.x + offset.y * offset.y)
    if (distance > swipeThreshold) {
      setCards((prevCards) => {
        const [topCard, ...restCards] = prevCards
        return [...restCards, topCard]
      })
    } else {
      setShouldReturnToCenter(true)
      setTimeout(() => setShouldReturnToCenter(false), 1000)
    }
  }

  const getCardStyle = (index) => {
    const totalCards = cards.length
    const stackOffset = index * 8
    const scaleValue = 1 - index * 0.05
    const rotationValue =
      totalCards > 1
        ? tiltAngleStart + (index / (totalCards - 1)) * (tiltAngle - tiltAngleStart)
        : tiltAngleStart
    const xOffsetValue = totalCards > 1 ? (index / (totalCards - 1)) * xOffset : 0
    const depthOffset = index * 10
    const isTopCard = index === 0
    const shouldReturn = isTopCard && shouldReturnToCenter

    return {
      zIndex: cards.length - index,
      scale: scaleValue,
      x: shouldReturn ? 0 : xOffsetValue,
      y: shouldReturn ? 0 : -stackOffset,
      rotate: shouldReturn ? 0 : rotationValue,
      z: -depthOffset,
      opacity: 1,
    }
  }

  const radiusPx = (cardRadius / 20) * (Math.min(cardWidth, cardHeight) / 2)

  return (
    <div
      style={{
        ...style,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        perspective: "1000px",
      }}
    >
      <div
        style={{
          position: "relative",
          width: cardWidth,
          height: cardHeight,
        }}
      >
        {cards.map((card, index) => {
          const isTopCard = index === 0
          const cardStyle = getCardStyle(index)
          const cardImage = imgs[card.imageIndex]

          return (
            <motion.div
              key={card.id}
              drag={isTopCard ? true : false}
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.7}
              dragMomentum={false}
              dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
              onMouseDown={isTopCard ? handlePointerDown : undefined}
              onMouseUp={isTopCard ? handlePointerUp : undefined}
              onDragEnd={isTopCard ? (_, info) => handleDragEnd(info) : undefined}
              animate={cardStyle}
              transition={{
                x: transition,
                y: transition,
                rotate: transition,
                scale: transition,
                zIndex: { duration: 0.3, ease: "easeOut" },
                z: { duration: 0.3, ease: "easeOut" },
              }}
              whileDrag={{ scale: 1.05, rotate: tiltAngleStart, zIndex: 1000 }}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                backgroundColor: cardImage ? "transparent" : "rgba(243, 239, 255, 0.8)",
                borderRadius: radiusPx,
                display: "flex",
                alignItems: "center",
                backdropFilter: cardImage ? "none" : "blur(10px)",
                justifyContent: "center",
                fontSize: "32px",
                fontWeight: "300",
                fontFamily: "system-ui",
                color: "#9967FF",
                cursor: isTopCard ? (isPressed ? "grabbing" : "grab") : "default",
                userSelect: "none",
                backgroundImage: cardImage ? `url(${cardImage.src})` : undefined,
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                overflow: "hidden",
                border: cardImage ? "none" : "1.5px solid #9967FF",
              }}
            >
              {!cardImage && (
                <p style={{ fontSize: 14, color: "#9967FF", padding: 20, textAlign: "center" }}>
                  {card.content} — Add images
                </p>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
