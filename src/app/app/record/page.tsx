'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mic, Square, Upload, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

import { LiveTranscriptionPanel } from '@/components/live-transcription-panel';
import { TranscriptionProgress, type ProcessingStage } from '@/components/transcription-progress';
import { compressAudio } from '@/lib/audio-compress';

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
    length: number;
  }>;
};

export default function RecordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [uploadedCallId, setUploadedCallId] = useState<string | null>(null);
  const [liveSessionId, setLiveSessionId] = useState(() => crypto.randomUUID());
  const [speechSupported, setSpeechSupported] = useState(false);
  const [removeFillers, setRemoveFillers] = useState(true);
  const [language, setLanguage] = useState(''); // '' = auto-detect (Whisper default)
  // Transcription progress state (replaces silent toast.promise)
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('idle');
  const [processingFileSizeMB, setProcessingFileSizeMB] = useState(5);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const isRecordingRef = useRef(false);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const extensionSessionId = searchParams.get('liveSessionId');
  const extensionSource = searchParams.get('source') === 'extension';
  const activeSessionId = extensionSessionId || liveSessionId;
  const livePanelActive = isRecording || Boolean(extensionSessionId);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    const speechWindow = window as Window & {
      SpeechRecognition?: new () => BrowserSpeechRecognition;
      webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
    };
    setSpeechSupported(Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition));

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const sessionId = crypto.randomUUID();
      setLiveSessionId(sessionId);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await uploadRecording(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      isRecordingRef.current = true;
      startSpeechRecognition(sessionId);
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      toast.success('Recording started');
    } catch (error) {
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      isRecordingRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      setDuration(0);
      toast.success('Recording stopped');
    }
  };

  const uploadRecording = async (blob: Blob) => {
    const fileSizeMB = blob.size / (1024 * 1024);
    if (fileSizeMB > 500) {
      toast.error(`File too large (${fileSizeMB.toFixed(1)}MB). Maximum is 500MB.`);
      return;
    }

    setProcessingFileSizeMB(fileSizeMB);
    setProcessingStage('uploading');
    setProcessingError(null);

    try {
      let uploadFile = blob;
      let uploadName = `recording-${Date.now()}.webm`;
      if (fileSizeMB > 50) {
        const compressed = await compressAudio(new File([blob], uploadName, { type: 'audio/webm' }));
        uploadFile = compressed;
        uploadName = compressed.name;
      }

      // Get a presigned upload URL from our server
      const { presignedUrl, blobUrl, contentType: uploadContentType } = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: uploadName,
          contentType: uploadFile.type || 'audio/webm',
          fileSize: uploadFile.size,
        }),
      }).then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Failed to get upload URL');
        return d;
      });

      // Upload directly to Vercel Blob (bypasses serverless body limit).
      // Use the server-validated canonical MIME so the PUT Content-Type
      // header exactly matches the token's allowedContentTypes — Vercel
      // rejects uploads whose content-type isn't an exact match.
      await fetch(presignedUrl, {
        method: 'PUT',
        body: uploadFile,
        headers: { 'Content-Type': uploadContentType },
      });

      setProcessingStage('transcribing');

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blobUrl,
          removeFillers,
          language,
          template: 'b2b-sales',
        }),
      });

      setProcessingStage('analyzing');

      const respContentType = res.headers.get('content-type');
      if (!respContentType || !respContentType.includes('application/json')) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process recording');

      const callId = data?.call?.id || data?.id;
      if (callId) setUploadedCallId(callId);
      setProcessingStage('done');
      toast.success('Call analyzed successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to process recording';
      setProcessingError(message);
      setProcessingStage('error');
      toast.error(message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 500) {
      toast.error(`File too large (${fileSizeMB.toFixed(1)}MB). Maximum is 500MB.`);
      return;
    }

    setProcessingFileSizeMB(fileSizeMB);
    setProcessingStage('uploading');
    setProcessingError(null);

    try {
      let uploadFile: Blob | File = file;
      let uploadName = file.name;
      if (fileSizeMB > 50) {
        const compressed = await compressAudio(file);
        uploadFile = compressed;
        uploadName = compressed.name;
      }

      const { presignedUrl, blobUrl, contentType: uploadContentType } = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: uploadName,
          contentType: uploadFile.type || file.type || 'audio/mpeg',
          fileSize: uploadFile.size,
        }),
      }).then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Failed to get upload URL');
        return d;
      });

      await fetch(presignedUrl, {
        method: 'PUT',
        body: uploadFile,
        headers: { 'Content-Type': uploadContentType },
      });

      setProcessingStage('transcribing');

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blobUrl,
          removeFillers,
          language,
          template: 'b2b-sales',
        }),
      });

      setProcessingStage('analyzing');

      const respContentType = res.headers.get('content-type');
      if (!respContentType || !respContentType.includes('application/json')) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process recording');

      const callId = data?.call?.id || data?.id;
      if (callId) setUploadedCallId(callId);
      setProcessingStage('done');
      toast.success('Call analyzed successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to process recording';
      setProcessingError(message);
      setProcessingStage('error');
      toast.error(message);
    }
  };

  const startSpeechRecognition = (sessionId: string) => {
    const speechWindow = window as Window & {
      SpeechRecognition?: new () => BrowserSpeechRecognition;
      webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
    };

    const RecognitionCtor =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!RecognitionCtor) {
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript?.trim();
        if (!transcript) continue;

        void fetch('/api/transcribe/live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            text: transcript,
            isFinal: result.isFinal,
          }),
        });
      }
    };

    recognition.onerror = (event) => {
      // Map known SpeechRecognition error codes to actionable
      // messages. "no-speech" is normal mid-conversation silence
      // and not surfaced. Everything else is shown, plus a
      // fallback for unknown codes so the user is never left
      // wondering why captions disappeared.
      const code = event?.error as string | undefined;
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        toast.error('Microphone permission denied for live captions. Recording still saves to disk.');
        return;
      }
      if (code === 'audio-capture') {
        toast.error('No microphone available for live captions. Recording still saves to disk.');
        return;
      }
      if (code === 'network') {
        toast.error('Network error during live captions. Recording still saves to disk.');
        return;
      }
      if (code === 'aborted') {
        // User-initiated stop. Not an error.
        return;
      }
      if (code === 'no-speech') {
        return;
      }
      toast.error('Live captions unavailable. Recording still saves to disk.');
    };

    recognition.onend = () => {
      if (isRecordingRef.current) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white mb-2">Record Call</h1>
        <p className="text-zinc-400">Record a sales call directly from your browser</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
        <div className="space-y-6">
          {/* Transcription progress panel — replaces the silent toast */}
          <TranscriptionProgress
            stage={processingStage}
            fileSizeMB={processingFileSizeMB}
            errorMessage={processingError || undefined}
            onDismiss={() => {
              setProcessingStage('idle');
              setProcessingError(null);
            }}
            onViewCall={
              uploadedCallId
                ? () => router.push(`/app/calls/${uploadedCallId}`)
                : undefined
            }
          />

          <div className="doppel-outer-dark">
            <div className="doppel-inner-dark p-12 flex flex-col items-center justify-center">
              <div className={`mb-6 ${isRecording ? 'animate-pulse-recording' : ''}`}>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                  isRecording ? 'bg-red-500/20' : 'bg-emerald-500/20'
                }`}>
                  {isRecording ? (
                    <Square className="w-10 h-10 text-red-400" />
                  ) : (
                    <Mic className="w-10 h-10 text-emerald-400" />
                  )}
                </div>
              </div>
              
              <p className="text-2xl font-mono text-white mb-6">{formatDuration(duration)}</p>
              
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-8 py-3 rounded-full font-medium transition-all active:scale-[0.98] ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </button>

              <p className="text-xs text-zinc-500 mt-4">
                {speechSupported
                  ? 'Browser speech recognition is available for live captions.'
                  : 'Browser speech recognition is unavailable; the panel can still receive external caption events.'}
              </p>
              <label className="mt-5 flex items-center gap-3 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={removeFillers}
                  onChange={(e) => setRemoveFillers(e.target.checked)}
                  className="h-4 w-4 rounded border border-zinc-700 bg-zinc-900 accent-emerald-500"
                />
                Polish transcript by removing filler words
              </label>
              <LanguagePicker value={language} onChange={setLanguage} />
            </div>
          </div>

          <div className="doppel-outer-dark">
            <div className="doppel-inner-dark p-6">
              <h2 className="text-lg font-medium text-white mb-4">Or Upload Audio</h2>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors">
                <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                <span className="text-sm text-zinc-400">Click to upload or drag and drop</span>
                <span className="text-xs text-zinc-600 mt-1">MP3, WAV, M4A up to 500MB</span>
                <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} />
              </label>
              <label className="mt-4 flex items-center gap-3 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={removeFillers}
                  onChange={(e) => setRemoveFillers(e.target.checked)}
                  className="h-4 w-4 rounded border border-zinc-700 bg-zinc-900 accent-emerald-500"
                />
                Polish transcript by removing filler words
              </label>
              <LanguagePicker value={language} onChange={setLanguage} />
              {uploadedCallId && (
                <a
                  href={`/app/calls/${uploadedCallId}`}
                  className="inline-flex items-center gap-2 mt-4 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View uploaded call
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {extensionSource && extensionSessionId ? (
            <div className="doppel-outer-dark">
              <div className="doppel-inner-dark p-4 text-sm text-zinc-300">
                Viewing a live Google Meet stream from the Chrome extension.
              </div>
            </div>
          ) : null}
          <LiveTranscriptionPanel active={livePanelActive} sessionId={activeSessionId} />
        </div>
      </div>
    </div>
  );
}

/**
 * Language picker for transcription.
 *
 * Defaults to "Auto-detect" (Whisper's default behavior).
 * The values here cover the languages most common in B2B
 * sales calls globally — Whisper itself supports 99 languages;
 * for any language not on this list, the auto-detect path
 * picks it up from the audio.
 */
const SUPPORTED_LANGUAGES: Array<{ code: string; label: string }> = [
  { code: "", label: "Auto-detect" },
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "pt", label: "Portuguese" },
  { code: "it", label: "Italian" },
  { code: "nl", label: "Dutch" },
  { code: "pl", label: "Polish" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese (Mandarin)" },
  { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" },
];

function LanguagePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="mt-4 flex items-center gap-3 text-sm text-zinc-300">
      <span className="text-zinc-400">Transcription language:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-sm text-white focus:outline-none focus:border-emerald-500/50"
      >
        {SUPPORTED_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
