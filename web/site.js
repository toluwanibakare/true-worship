/* True Worship website: small, dependency-free enhancements.
   Everything here is progressive: the page reads and works without it, and
   motion is skipped for visitors who ask for reduced motion. */
(() => {
  const root = document.documentElement
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const $ = (selector, scope = document) => scope.querySelector(selector)
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)]

  /* The bar turns to glass once the page moves. */
  const bar = $('.bar')
  const onScroll = () => bar && bar.classList.toggle('scrolled', window.scrollY > 12)
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })

  /* Mobile menu. */
  const menuButton = $('.menu-btn')
  if (menuButton) {
    const setOpen = (open) => {
      root.classList.toggle('menu-open', open)
      menuButton.setAttribute('aria-expanded', String(open))
    }
    menuButton.addEventListener('click', () => setOpen(!root.classList.contains('menu-open')))
    $$('.links a').forEach((link) => link.addEventListener('click', () => setOpen(false)))
    window.addEventListener('keydown', (event) => event.key === 'Escape' && setOpen(false))
  }

  /* The link for the section on screen is lit. */
  const links = $$('.links a[href^="#"]')
  const targets = links.map((link) => $(link.getAttribute('href'))).filter(Boolean)
  if ('IntersectionObserver' in window && targets.length) {
    const lit = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          links.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`))
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    targets.forEach((target) => lit.observe(target))
  }

  /* Things rise into place as they arrive; siblings arrive one after another. */
  const reveals = $$('.reveal')
  reveals.forEach((element) => {
    const siblings = [...element.parentElement.children].filter((child) => child.classList.contains('reveal'))
    element.style.setProperty('--i', String(Math.min(siblings.indexOf(element), 8)))
  })
  if ('IntersectionObserver' in window && !reduce) {
    const arrive = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('in')
          arrive.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    reveals.forEach((element) => arrive.observe(element))
  } else {
    reveals.forEach((element) => element.classList.add('in'))
  }

  /* A soft light follows the cursor across a card. */
  $$('.card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const box = card.getBoundingClientRect()
      card.style.setProperty('--mx', `${event.clientX - box.left}px`)
      card.style.setProperty('--my', `${event.clientY - box.top}px`)
    })
  })

  /* The hero window leans toward the pointer. */
  const tilt = $('.tilt')
  const stage = $('.hero')
  if (tilt && stage && !reduce && window.matchMedia('(hover: hover)').matches) {
    let frame = 0
    stage.addEventListener('pointermove', (event) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const box = tilt.getBoundingClientRect()
        const x = (event.clientX - (box.left + box.width / 2)) / window.innerWidth
        const y = (event.clientY - (box.top + box.height / 2)) / window.innerHeight
        tilt.classList.add('moving')
        tilt.style.setProperty('--ry', `${(x * 9).toFixed(2)}deg`)
        tilt.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`)
      })
    })
    stage.addEventListener('pointerleave', () => {
      tilt.classList.remove('moving')
      tilt.style.setProperty('--rx', '0deg')
      tilt.style.setProperty('--ry', '0deg')
    })
  }

  /* The ticker repeats itself so it loops without a gap. */
  const track = $('.ticker-track')
  if (track && track.firstElementChild) {
    const copy = track.firstElementChild.cloneNode(true)
    copy.setAttribute('aria-hidden', 'true')
    track.append(copy)
  }

  /* Screenshot gallery: tabs built from the captions, a crossfade between
     frames, and a slow auto-advance that stops once someone takes over. */
  $$('[data-gallery]').forEach((gallery) => {
    const frames = $$('.frame', gallery)
    const tabs = $('.tabs', gallery)
    if (frames.length < 2 || !tabs) return
    const dwell = 7000
    gallery.style.setProperty('--dwell', `${dwell}ms`)
    let current = 0
    let timer = 0

    const buttons = frames.map((frame, index) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'tab'
      button.setAttribute('role', 'tab')
      button.textContent = frame.dataset.title || `Screen ${index + 1}`
      button.addEventListener('click', () => {
        stop()
        show(index)
      })
      tabs.append(button)
      return button
    })

    function show(index) {
      current = (index + frames.length) % frames.length
      frames.forEach((frame, i) => frame.classList.toggle('is-active', i === current))
      buttons.forEach((button, i) => button.setAttribute('aria-selected', String(i === current)))
    }
    function schedule() {
      clearTimeout(timer)
      timer = window.setTimeout(() => {
        show(current + 1)
        schedule()
      }, dwell)
    }
    function stop() {
      clearTimeout(timer)
      gallery.classList.add('paused')
    }

    show(0)
    if (!reduce && 'IntersectionObserver' in window) {
      // Only advance while the gallery is on screen.
      new IntersectionObserver(
        ([entry]) => {
          if (gallery.classList.contains('paused')) return
          entry.isIntersecting ? schedule() : clearTimeout(timer)
        },
        { threshold: 0.35 },
      ).observe(gallery)
    } else {
      gallery.classList.add('paused')
    }
  })

  /* Copy buttons on the code block. */
  $$('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const source = $(button.dataset.copy)
      if (!source) return
      try {
        await navigator.clipboard.writeText(source.innerText.replace(/^\$ /gm, ''))
        const label = button.textContent
        button.textContent = 'Copied'
        button.classList.add('done')
        setTimeout(() => {
          button.textContent = label
          button.classList.remove('done')
        }, 1800)
      } catch {
        // Clipboard blocked: the text is still there to select.
      }
    })
  })
})()
