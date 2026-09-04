# Stryg.Bytes — Portfolio

Dual-mode portfolio for **Stryg.Bytes** (full-stack development studio) and **Gio** (personal IT Engineer profile).

## Tech Stack

- **Vite** 5 + vanilla JS
- **CSS + Canvas 2D** — Layered gradient blobs, SVG film grain, particle field (Dev mode background)
- **React + Three.js + postprocessing** — PixelBlast background (Normal mode)
- **React + Framer Motion** — Swipe Card Stack interaction (Normal mode)
- **GSAP** + ScrollTrigger — animations, text reveals, typewriter effect
- **Lenis** — smooth scrolling
- **CSS** custom properties (dark/light theme, dual mode)

## Features

- **Dual mode** (Dev / Normal) — Stryg.Bytes studio vs personal IT Engineer profile
- **Grid loading screen** — Stryg.Bytes glitch → 144-block grid wipe → hero reveal
- **Layered Dev background** — CSS animated gradient blobs, SVG film grain overlay, Canvas 2D particles with mouse repulsion
- **3D Following Eyes** — realistic-ish eye pair in hero, tracks cursor with perspective transforms (Dev mode)
- **Premium split hero** — asymmetric two-column layout with glass card for eyes (Dev mode)
- **PixelBlast background** — Three.js pixel grid with mouse-reactive ripples (Normal mode)
- **Swipe Card Stack** — interactive Tinder-style card stack with photos (Normal mode)
- **Typewriter effect** — cycling role titles in Normal hero eyebrow
- **Logo marquee** — scrolling tech stack strip between sections (Normal mode)
- **"Why Stryg.Bytes" value cards** — premium glass cards with ghost numbers, shine sweeps, and client-benefit copy (Dev mode About)
- **Premium Services bento** — glass cards with gradient borders, ghost numbers, shine sweeps, tech tags, and deliverable lists (Dev mode)
- **Animated wave dividers** — multi-layer parallax SVG waves between Hero → About → Services (Dev mode)
- **Service pillars** — visual icon grid for Stryg.Bytes offerings (Dev mode About)
- **Alternating centered timeline** — 5-step process with progressive step activation (Dev mode)
- **Personal gate** — "Meet Gio →" transition at bottom of Dev portfolio
- **Scroll-triggered text reveals** — word-by-word translateY stagger on section titles
- **Lenis smooth scroll** throughout (native scrollbar hidden)

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |

## Sections

### Dev mode (Stryg.Bytes)

1. **Hero** — "Welcome to the Studio" split layout with 3D following eyes
2. **About** — "Why Stryg.Bytes" value proposition, premium client-benefit cards, stats bar
3. **Services** — premium bento cards (Motion & Animation, Immersive 3D & WebGL, Full-Stack Engineering)
4. **Projects** — featured work grid
5. **Process** — 5-step centered alternating timeline
6. **Personal Gate** — "Meet Gio →" transition into Normal mode
7. **Contact** — form + social links

### Normal mode (Gio)

1. **Hero** — personal landing + Swipe Card Stack
2. **Logo marquee** — tech / IT skills strip
3. **Skills** — capability cards with progress bars
4. **Hobbies** — interests grid
5. **Experience** — career path + milestones timelines
6. **Contact** — form + social links

## Project Structure

```
src/
├── main.js                 # Entry point
├── styles/
│   ├── tokens.css          # CSS custom properties
│   ├── base.css            # Reset, body, shared layouts
│   ├── utilities.css       # Wave dividers, mode visibility, noise
│   ├── responsive.css      # Breakpoints
│   └── components/         # Per-section CSS files
│       ├── dev-bg.css      # Gradient blobs + grain overlay (Dev)
│       ├── hero-eyes.css   # 3D following eyes styles (Dev)
│       └── skills.css      # Services bento + Normal skills/hobbies
├── js/
│   └── modules/
│       ├── loader.js       # Grid loading screen
│       ├── dev-particles.js # Canvas 2D particle field (Dev)
│       ├── hero-eyes.js    # 3D following eyes cursor tracking (Dev)
│       ├── lenis.js        # Smooth scroll
│       ├── animations.js   # GSAP scroll animations
│       ├── navigation.js   # Nav + mode-aware links
│       ├── mode-toggle.js  # Dev/Normal switch
│       ├── text-reveal.js  # Word-by-word section title reveals
│       ├── text-morph.js   # Hero eyebrow cycling (Dev)
│       ├── text-type.js    # Typewriter effect (Normal)
│       ├── SwipeStack.jsx  # Card stack component (Normal)
│       ├── mountSwipeStack.jsx  # React mount factory
│       ├── PixelBlast.jsx  # Three.js shader background (Normal)
│       ├── mountPixelBlast.jsx  # React mount factory
│       └── helpers.js      # Utility helpers
└── utils/
    └── helpers.js
```

## Session Notes (in progress)

### Done
- Replaced Lightfall/OGL with layered Dev background (gradients + grain + particles)
- Removed `ogl` dependency
- Top nav logo fully white (Stryg.Bytes)
- Hero copy → "Welcome to the Studio" + single Explore CTA
- 3D following eyes added to Dev hero (currently between subtitle and CTA)

### Next (tomorrow)
- Premium split hero layout (text left, eyes right in glass card)
- Title stacked on 3 lines for editorial rhythm
- Responsive stacking for mobile
