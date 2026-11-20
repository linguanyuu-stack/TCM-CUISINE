export function initEngine(images: Record<string, string>): Promise<void>;
export function renderFrame(t: number, frameIdx: number, camShot: string): HTMLCanvasElement;
export const DUR: number;
export const FPS: number;
