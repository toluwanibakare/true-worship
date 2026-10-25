/**
 * What is dragged from a resource list (Songs, Scriptures) onto the
 * schedule. The tables write it into the drag, the schedule reads it on
 * drop, and neither knows about the other: both use this one format.
 */
export const RESOURCE_MIME = 'application/x-true-worship-resource'

export type ResourceDrag =
  | { kind: 'song'; id: string }
  | { kind: 'scripture'; reference: string; slides: string[][]; version: string }

export const encodeResource = (resource: ResourceDrag) => JSON.stringify(resource)

/** The dragged resource, or null when the data is not one of ours. */
export function decodeResource(data: string): ResourceDrag | null {
  try {
    const value = JSON.parse(data) as ResourceDrag
    if (value.kind === 'song' && typeof value.id === 'string') return value
    if (value.kind === 'scripture' && typeof value.reference === 'string' && Array.isArray(value.slides)) {
      return value
    }
  } catch {
    // Not ours.
  }
  return null
}
