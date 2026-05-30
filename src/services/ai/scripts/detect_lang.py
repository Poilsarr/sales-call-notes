import sys
import whisper

def main():
    if len(sys.argv) < 2:
        print("ERROR: No audio file provided", file=sys.stderr)
        sys.exit(1)

    audio_path = sys.argv[1]

    try:
        model = whisper.load_model("base")
        audio = whisper.load_audio(audio_path)
        # Use transcribe with language=None for detection
        result = model.transcribe(audio, language=None)
        print(result.get("language", "en"))
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
