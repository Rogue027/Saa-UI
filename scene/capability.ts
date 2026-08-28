type NavigatorWithDeviceMemory = Navigator & { deviceMemory?: number };

export function canRunEnhancedScene(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;

    const nav = navigator as NavigatorWithDeviceMemory;
    if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return false;
    if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency < 4) return false;
    if (window.innerWidth < 768) return false;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}
