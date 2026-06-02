/**
 * Utilities for sharing graph state via URL
 */

export interface GraphState {
  nodes: number[];  // Just the IDs
}

/**
 * Encode graph state to a compact URL parameter
 * Example: nodes=1,2,3,4 becomes "1-2-3-4"
 */
export function encodeGraphState(nodeIds: number[]): string {
  if (nodeIds.length === 0) return '';
  return nodeIds.sort((a, b) => a - b).join('-');
}

/**
 * Decode graph state from URL parameter
 * Example: "1-2-3-4" becomes [1, 2, 3, 4]
 */
export function decodeGraphState(encoded: string): number[] {
  if (!encoded || encoded.trim() === '') return [];
  
  try {
    return encoded
      .split('-')
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id) && id >= 0);
  } catch {
    return [];
  }
}

/**
 * Generate a shareable URL with current graph state
 */
export function generateShareUrl(nodeIds: number[]): string {
  const encoded = encodeGraphState(nodeIds);
  if (!encoded) return window.location.origin + window.location.pathname;
  
  const url = new URL(window.location.href);
  url.searchParams.set('nodes', encoded);
  return url.toString();
}

/**
 * Read graph state from current URL
 */
export function readShareUrl(): number[] | null {
  const params = new URLSearchParams(window.location.search);
  const nodesParam = params.get('nodes');
  
  if (!nodesParam) return null;
  
  return decodeGraphState(nodesParam);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}
