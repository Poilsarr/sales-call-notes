'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mic, Square, Upload, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

import { LiveTranscriptionPanel } from '@/components/live-transcription-panel';

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
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [uploadedCallId, setUploadedCallId] = useState<string | null>(null);
  const [liveSessionId, setLiveSessionId] = useState(() => crypto.randomUUID());
  const [speechSupported, setSpeechSupported] = useState(false);
  const [removeFillers, setRemoveFillers] = useState(true);
  const [language, setLanguage] = useState(''); // '' = auto-detect (Whisper default)
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
    const formData = new FormData();
    formData.append('file', blob, 'recording.webm');
    formData.append('removeFillers', String(removeFillers));
    formData.append('language', language);
    formData.append('template', 'b2b-sales');
    
    // Check file size before uploading (Vercel limit is 4.5MB)
    const fileSizeMB = blob.size / (1024 * 1024);
    if (fileSizeMB > 4) {
      toast.error(`File too large (${fileSizeMB.toFixed(1)}MB). Vercel limit is 4MB. Try a shorter recording.`);
      return;
    }
    
    toast.promise(
      fetch('/api/analyze', { method: 'POST', body: formData }).then(async res => {
        // Check if response is JSON before parsing
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to process recording');
        return data;
      }),
      {
        loading: 'Processing recording...',
        success: (data) => {
          const callId = data?.call?.id || data?.id;
          if (callId) {
            setUploadedCallId(callId);
            return 'Call analyzed successfully';
          }
          return 'Call analyzed successfully';
        },
        error: (err) => err.message || 'Failed to process recording',
      }
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Vercel serverless function limit is 4.5MB
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 4) {
      toast.error(`File too large (${fileSizeMB.toFixed(1)}MB). Maximum is 4MB. Try a shorter recording or compress the file.`);
      return;
    }
    uploadRecording(file);
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
          <div className="doppel-outer-dark">
            <div className="doppel-inner-dark p-12 flex flex-col items-center justify-center">
              <motion.div
                animate={isRecording ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                transition={{ repeat: isRecording ? Infinity : 0, duration: 1.5 }}
                className="mb-6"
              >
                <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                  isRecording ? 'bg-red-500/20' : 'bg-emerald-500/20'
                }`}>
                  {isRecording ? (
                    <Square className="w-10 h-10 text-red-400" />
                  ) : (
                    <Mic className="w-10 h-10 text-emerald-400" />
                  )}
                </div>
              </motion.div>
              
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
                <span className="text-xs text-zinc-600 mt-1">MP3, WAV, M4A up to 50MB</span>
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
