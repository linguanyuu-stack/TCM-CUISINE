import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, Easing, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

loadFont({ family: "TitleTC", url: staticFile("caption60.woff2"), weight: "700" });

const Leaf: React.FC<{ flip?: boolean }> = ({ flip }) => (
  <svg width={46} height={46} viewBox="-1 -1.1 2 1.5" style={{ scale: flip ? "-1 1" : "1 1" }}>
    <path d="M0 -.12 C-.12 -.25 -.5 -.5 -.56 -.74 C-.42 -.98 -.16 -1 -.04 -.86 L0 -.74 L.04 -.86 C.16 -1 .42 -.98 .56 -.74 C.5 -.5 .12 -.25 0 -.12 Z" fill="#f2c03a" stroke="#a86a1c" strokeWidth={0.04} />
    <path d="M0 -.12 L0 .25" stroke="#a8741e" strokeWidth={0.04} />
  </svg>
);

/** 何首烏's promise, shown as on-screen text (no voiceover). */
export const Caption: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end" }}>
      <Interactive.Div
        name="Caption band"
        style={{
          height: 240,
          background: "linear-gradient(rgba(20,16,30,0), rgba(20,16,30,.55) 50%, rgba(20,16,30,.65))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          opacity: interpolate(frame, [0, 0.9 * fps, durationInFrames - 0.9 * fps, durationInFrames], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [0, 0.9 * fps], ["0px 14px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <Leaf flip />
        <div
          style={{
            fontFamily: "TitleTC",
            fontWeight: 700,
            fontSize: 78,
            color: "#fff1d2",
            WebkitTextStroke: "12px rgba(70,30,10,.85)",
            paintOrder: "stroke fill",
            letterSpacing: 2,
          }}
        >
          來年大家還要再次相聚喔！
        </div>
        <Leaf />
      </Interactive.Div>
    </AbsoluteFill>
  );
};
