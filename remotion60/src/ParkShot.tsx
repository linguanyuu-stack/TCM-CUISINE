import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { initEngine, renderFrame } from "./engine/engine";

const IMAGES = {
  wu_tex: staticFile("art/wu_tex.png"),
  wu_sprout: staticFile("art/wu_sprout.png"),
  tex_cape: staticFile("art/tex_cape.png"),
  di_body: staticFile("art/di_body.png"),
  di_yawn: staticFile("art/di_yawn.png"),
};

export type ParkShotProps = {
  /** shot id from the cue list, e.g. "06" — picks the camera */
  shot: string;
  /** film time (seconds) at this sequence's first frame */
  from: number;
};

/**
 * One camera on the shared park world. The world (set, nine friends, gray crowd,
 * light, fireworks) is painted by the engine as a pure function of film time,
 * so every shot sees the same positions and the soundtrack stays in sync.
 */
export const ParkShot: React.FC<ParkShotProps> = ({ shot, from }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  const [handle] = useState(() => delayRender(`Painting shot ${shot}`));
  const released = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initEngine(IMAGES)
      .then(() => setReady(true))
      .catch((e) => cancelRender(e));
  }, []);

  useLayoutEffect(() => {
    if (!ready || !ref.current) return;
    const t = from + frame / fps;
    const gl = renderFrame(t, Math.round(t * fps), shot);
    ref.current.getContext("2d")!.drawImage(gl, 0, 0, width, height);
    if (!released.current) {
      released.current = true;
      continueRender(handle);
    }
  }, [ready, frame, fps, from, shot, width, height, handle]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={width} height={height} style={{ width: "100%", height: "100%" }} />
    </AbsoluteFill>
  );
};
