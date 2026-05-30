import sys
import json
import torch
from pyannote.audio import Pipeline

def main():
    if len(sys.argv) < 2:
        print("ERROR: No audio file provided", file=sys.stderr)
        sys.exit(1)

    audio_path = sys.argv[1]

    try:
        # Use HF token from environment
        # The user should set HF_TOKEN in their .env
        pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1")

        # Use GPU if available, else CPU
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        pipeline.to(device)

        diarization = pipeline(audio_path)

        speakers = {}
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            if speaker not in speakers:
                speakers[speaker] = []
            speakers[speaker].append({
                "speaker": speaker,
                "start": turn.start,
                "end": turn.end
            })

        print(json.dumps({
            "speakers": [
                {
                    "label": label,
                    "segments": segments
                } for label, segments in speakers.items()
            ]
        }))
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
