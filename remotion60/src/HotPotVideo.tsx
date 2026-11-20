import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption } from "./Caption";
import { ParkShot } from "./ParkShot";

/**
 * 一起圍爐 — 60 s at 24 fps. Shot boundaries match the cue list in the engine
 * (picnic60/src/cues.js) so every footstep, clink and firework lands on its frame.
 * A sequence that fades into the next is extended by the fade length, so the
 * next shot still starts exactly on its cue time (total stays 1440 frames).
 */
export const HotPotVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence name="01 Wide park" durationInFrames={108}>
          <ParkShot shot="01" from={0} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Sequence name="02 At the pot" durationInFrames={96}>
          <ParkShot shot="02" from={4.5} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Sequence name="03 Right side" durationInFrames={96}>
          <ParkShot shot="03" from={8.5} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Sequence name="04 Arrivals" durationInFrames={96}>
          <ParkShot shot="04" from={12.5} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Sequence name="05 Gathering" durationInFrames={84}>
          <ParkShot shot="05" from={16.5} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Sequence name="06 Ladle & hand-off" durationInFrames={144}>
          <ParkShot shot="06" from={20} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Sequence name="07 Everyone sips" durationInFrames={96}>
          <ParkShot shot="07" from={26} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Sequence name="08 Clink" durationInFrames={96}>
          <ParkShot shot="08" from={30} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Sequence name="09 Drinking contest" durationInFrames={96}>
          <ParkShot shot="09" from={34} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Sequence name="10 Laughter" durationInFrames={62}>
          <ParkShot shot="10" from={38} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 14 })} />
        <TransitionSeries.Sequence name="11 Dusk to night" durationInFrames={144}>
          <ParkShot shot="11" from={40} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Sequence name="12 Fireworks" durationInFrames={156}>
          <ParkShot shot="12" from={46} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
        <TransitionSeries.Sequence name="13 Promise" durationInFrames={192}>
          <ParkShot shot="13" from={52} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <Sequence name="Caption" from={1320} durationInFrames={115}>
        <Caption />
      </Sequence>

      <AbsoluteFill
        name="Fade"
        style={{
          backgroundColor: "#000",
          pointerEvents: "none",
          opacity: interpolate(frame, [0, 0.7 * fps, durationInFrames - 0.7 * fps, durationInFrames - 1], [1, 0, 0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.33, 0, 0.67, 1),
          }),
        }}
      />
      <Audio src={staticFile("mix.wav")} />
    </AbsoluteFill>
  );
};
