/* True Worship website: small, dependency-free enhancements.
   The page reads and works without any of this; motion is skipped for
   visitors who ask for reduced motion. */
(() => {
  const root = document.documentElement
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const $ = (selector, scope = document) => scope.querySelector(selector)
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)]

  /* A hairline under the bar once the page moves. */
  const bar = $('.bar')
  const toTop = $('.to-top')
  const onScroll = () => {
    if (bar) bar.classList.toggle('scrolled', window.scrollY > 8)
    if (toTop) toTop.classList.toggle('show', window.scrollY > 700)
  }
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })

  /* Back to top. */
  if (toTop) {
    toTop.addEventListener('click', (event) => {
      event.preventDefault()
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
    })
  }

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

  /* The link for the section on screen is underlined. */
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

  /* Reveal on scroll. */
  const reveals = $$('.reveal')
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('in'))
  } else {
    const seen = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('in')
          seen.unobserve(entry.target)
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    reveals.forEach((el) => seen.observe(el))
  }

  /* Videos play only while on screen, and not at all for reduced motion. */
  /* Pick a file this browser can play: WebM where it can, MP4 (H.264) otherwise. */
  const webm = document.createElement('video').canPlayType('video/webm; codecs="vp9"') !== ''
  const pick = (video) => {
    if (video.currentSrc || video.src) return
    const file = webm ? video.dataset.webm : video.dataset.mp4
    if (file) video.src = file
  }
  /* If a browser blocks autoplay, show the controls so the visitor can press play. */
  const play = (video) => video.play().catch(() => video.setAttribute('controls', ''))
  const videos = $$('video[data-lazy]')
  if (reduce) {
    videos.forEach((video) => video.removeAttribute('autoplay'))
  } else if ('IntersectionObserver' in window) {
    const watcher = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target
        if (entry.isIntersecting) {
          pick(video)
          play(video)
        } else {
          video.pause()
        }
      })
    }, { threshold: 0.25 })
    videos.forEach((video) => watcher.observe(video))
  } else {
    videos.forEach((video) => {
      pick(video)
      play(video)
    })
  }
  /* The walkthrough pauses on click. */
  $$('video[data-toggle]').forEach((video) =>
    video.addEventListener('click', () => (video.paused ? video.play() : video.pause())),
  )

  /* "See it run" opens the walkthrough in a dialog; Esc, the x or a click outside closes it. */
  $$('[data-video]').forEach((button) => {
    const dialog = $(button.dataset.video)
    if (!dialog || !dialog.showModal) return
    const video = $('video', dialog)
    const note = $('[data-video-note]', dialog)
    let stall
    button.addEventListener('click', () => {
      video.preload = 'auto'
      dialog.showModal()
      if (note) note.hidden = true
      // If nothing is playing a few seconds on, offer the file itself.
      clearTimeout(stall)
      stall = setTimeout(() => {
        if (note && (video.paused || video.readyState < 3)) note.hidden = false
      }, 4000)
      video.currentTime = 0
      video.play().catch(() => video.setAttribute('controls', ''))
    })
    // When no source can be played, the last one reports the error.
    const lastSource = $$('source', video).pop()
    ;[video, lastSource].forEach((target) =>
      target?.addEventListener('error', () => {
        if (note) note.hidden = false
      }),
    )
    dialog.addEventListener('close', () => {
      clearTimeout(stall)
      video.pause()
    })
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog || event.target.hasAttribute('data-close')) dialog.close()
    })
  })

  /* Copy the commands. */
  $$('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const source = $(button.dataset.copy)
      if (!source) return
      const text = source.innerText.replace(/^\$ /gm, '')
      try {
        await navigator.clipboard.writeText(text)
        button.textContent = 'Copied'
      } catch {
        button.textContent = 'Press Ctrl+C'
      }
      setTimeout(() => (button.textContent = 'Copy'), 1800)
    })
  })

  /* Open FAQ answers one at a time. */
  const faqs = $$('details')
  faqs.forEach((item) =>
    item.addEventListener('toggle', () => {
      if (item.open) faqs.forEach((other) => other !== item && (other.open = false))
    }),
  )
})()
