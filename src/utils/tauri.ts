export function tauriAvailable(): boolean {
  return (window as any).__TAURI__ !== undefined;
}
