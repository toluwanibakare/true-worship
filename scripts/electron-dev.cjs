const { spawn } = require('node:child_process')
const http = require('node:http')

/**
 * Starts the Vite dev server, waits for it to answer, then opens the
 * Electron operator window against it. Ctrl+C stops both.
 */
const vite = spawn('npm', ['run', 'dev'], { stdio: 'inherit', shell: true })

function waitForVite(tries = 0) {
  const request = http.get('http://localhost:5173', (response) => {
    response.resume()
    const electron = spawn('npx', ['electron', '.'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, TW_DEV: '1' },
    })
    electron.on('exit', () => {
      vite.kill()
      process.exit(0)
    })
  })
  request.on('error', () => {
    if (tries > 60) {
      console.error('Vite did not start on http://localhost:5173')
      vite.kill()
      process.exit(1)
    }
    setTimeout(() => waitForVite(tries + 1), 500)
  })
}

process.on('SIGINT', () => {
  vite.kill()
  process.exit(0)
})

waitForVite()
