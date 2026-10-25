/**
 * URL of the sql.js WebAssembly file, bundled by Vite. Kept in its own
 * module so the Node-based importer tests never have to resolve a
 * Vite-only "?url" import.
 */
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'

export default wasmUrl
