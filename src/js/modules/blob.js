export function initBlob() {
  const wrap = document.getElementById('liquid-wrap')
  const bMain = document.getElementById('blob-main')
  const bA = document.getElementById('blob-a')
  const bB = document.getElementById('blob-b')
  const bC = document.getElementById('blob-c')
  let mx = window.innerWidth - 140, my = window.innerHeight - 140
  let cx = mx, cy = my
  let bax = 140, bay = 100, bbx = 170, bby = 152, bcx = 110, bcy = 158
  let t = 0
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY })
  function updateBlob() {
    cx += (mx - cx) * 0.1; cy += (my - cy) * 0.1
    wrap.style.left = cx + 'px'; wrap.style.top = cy + 'px'
    wrap.style.transform = 'translate(-50%,-50%)'
    t++
    bax += (140 + Math.sin(t * 0.025) * 30 - bax) * 0.07
    bay += (100 + Math.cos(t * 0.02) * 20 - bay) * 0.07
    bMain.setAttribute('r', 46 + Math.sin(t * 0.04) * 6)
    bA.setAttribute('cx', bax); bA.setAttribute('cy', bay)
    bA.setAttribute('r', 22 + Math.sin(t * 0.05 + 1) * 5)
    bbx += (170 + Math.cos(t * 0.018) * 22 - bbx) * 0.06
    bby += (152 + Math.sin(t * 0.022) * 18 - bby) * 0.06
    bB.setAttribute('cx', bbx); bB.setAttribute('cy', bby)
    bcx += (110 + Math.sin(t * 0.03 + 2) * 18 - bcx) * 0.08
    bcy += (158 + Math.cos(t * 0.026) * 14 - bcy) * 0.08
    bC.setAttribute('cx', bcx); bC.setAttribute('cy', bcy)
    requestAnimationFrame(updateBlob)
  }
  updateBlob()
}
