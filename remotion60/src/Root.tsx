import { Composition, Folder } from "remotion";
import { HotPotVideo } from "./HotPotVideo";
import { ParkShot } from "./ParkShot";

const SHOTS: { id: string; shot: string; from: number; frames: number }[] = [
  { id: "Shot01-WidePark", shot: "01", from: 0, frames: 108 },
  { id: "Shot02-AtThePot", shot: "02", from: 4.5, frames: 96 },
  { id: "Shot03-RightSide", shot: "03", from: 8.5, frames: 96 },
  { id: "Shot04-Arrivals", shot: "04", from: 12.5, frames: 96 },
  { id: "Shot05-Gathering", shot: "05", from: 16.5, frames: 84 },
  { id: "Shot06-Ladle", shot: "06", from: 20, frames: 144 },
  { id: "Shot07-Sips", shot: "07", from: 26, frames: 96 },
  { id: "Shot08-Clink", shot: "08", from: 30, frames: 96 },
  { id: "Shot09-Contest", shot: "09", from: 34, frames: 96 },
  { id: "Shot10-Laughter", shot: "10", from: 38, frames: 62 },
  { id: "Shot11-Dusk", shot: "11", from: 40, frames: 144 },
  { id: "Shot12-Fireworks", shot: "12", from: 46, frames: 156 },
  { id: "Shot13-Promise", shot: "13", from: 52, frames: 192 },
];

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HotPotUnderTheGinkgo"
        component={HotPotVideo}
        width={1920}
        height={1080}
        fps={24}
        durationInFrames={1440}
      />
      <Folder name="Shots">
        {SHOTS.map((s) => (
          <Composition
            key={s.id}
            id={s.id}
            component={ParkShot}
            defaultProps={{ shot: s.shot, from: s.from }}
            width={1920}
            height={1080}
            fps={24}
            durationInFrames={s.frames}
          />
        ))}
      </Folder>
    </>
  );
};
