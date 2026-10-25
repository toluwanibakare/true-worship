import type { Song } from './types'

/**
 * The song library, kept on this computer. A song added, edited or
 * imported stays until the user deletes it, across restarts and
 * refreshes. It lives in IndexedDB (an imported songbook can run to
 * thousands of songs, too much for localStorage) under "tw-songs".
 */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('tw-songs', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('library')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open storage.'))
  })
}

/** The saved library, or null when nothing has been saved yet. */
export async function loadSongs(): Promise<Song[] | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = db.transaction('library', 'readonly').objectStore('library').get('songs')
    request.onsuccess = () => {
      db.close()
      resolve(Array.isArray(request.result) ? (request.result as Song[]) : null)
    }
    request.onerror = () => {
      db.close()
      reject(request.error ?? new Error('Storage failed.'))
    }
  })
}

export async function saveSongs(songs: Song[]): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('library', 'readwrite')
    transaction.objectStore('library').put(songs, 'songs')
    transaction.oncomplete = () => {
      db.close()
      resolve()
    }
    transaction.onerror = () => {
      db.close()
      reject(transaction.error ?? new Error('Storage failed.'))
    }
  })
}
