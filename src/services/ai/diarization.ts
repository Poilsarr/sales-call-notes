import { readFile } from "fs/promises";
import { DeepgramClient } from "@deepgram/sdk";
import { getSecret } from "@/lib/secrets";

export interface SpeakerSegment {
  speaker: string;
  start: number;
  end: number;
}

export interface DiarizationResult {
  speakers: Array<{
    label: string;
    name?: string;
    segments: SpeakerSegment[];
    duration: number;
  }>;
  transcript: string;
}

const speakerLabel = (id: number | undefined): string => {
  if (typeof id !== "number" || id < 0) return "Speaker A";
  return `Speaker ${String.fromCharCode(65 + id)}`;
};

export class DiarizationService {
  async diarize(audioPath: string): Promise<DiarizationResult> {
    const apiKey = getSecret("DEEPGRAM_API_KEY");
    if (!apiKey) {
      throw new Error("DEEPGRAM_API_KEY is not set");
    }

    const deepgram = new DeepgramClient({ apiKey });
    const audio = await readFile(audioPath);

    const response = await deepgram.listen.v1.media.transcribeFile(
      audio,
      { model: "nova-2", diarize: true, smart_format: true },
    );

    if (!("results" in response) || !response.results) {
      throw new Error("Deepgram returned no results (async request?)");
    }

    const channel = response.results.channels?.[0];
    const alternative = channel?.alternatives?.[0];
    const words: any[] = alternative?.words ?? [];
    const transcript: string = alternative?.transcript ?? "";

    const bySpeaker = new Map<number, SpeakerSegment[]>();
    for (const w of words) {
      const sid = typeof w.speaker === "number" ? w.speaker : 0;
      if (!bySpeaker.has(sid)) bySpeaker.set(sid, []);
      bySpeaker.get(sid)!.push({
        speaker: speakerLabel(sid),
        start: w.start,
        end: w.end,
      });
    }

    const speakers = Array.from(bySpeaker.entries())
      .sort(([a], [b]) => a - b)
      .map(([sid, segments]) => ({
        label: speakerLabel(sid),
        segments,
        duration: segments.reduce((acc, s) => acc + (s.end - s.start), 0),
      }));

    return { speakers, transcript };
  }
}
