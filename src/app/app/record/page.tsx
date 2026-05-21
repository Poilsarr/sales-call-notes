'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, Square, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function RecordPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      toast.success('Recording stopped');
    }
  };

  const uploadRecording = async (blob: Blob) => {
    const formData = new FormData();
    formData.append('file', blob, 'recording.webm');
    
    toast.promise(
      fetch('/api/analyze', { method: 'POST', body: formData }).then(res => res.json()),
      {
        loading: 'Processing recording...',
        success: 'Call analyzed successfully',
        error: 'Failed to process recording',
      }
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white mb-2">Record Call</h1>
        <p className="text-zinc-400">Record a sales call directly from your browser</p>
      </div>
      
      <div className="doppel-outer">
        <div className="doppel-inner p-12 flex flex-col items-center justify-center">
          <motion.div
            animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
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
        </div>
      </div>
      
      <div className="doppel-outer">
        <div className="doppel-inner p-6">
          <h2 className="text-lg font-medium text-white mb-4">Or Upload Audio</h2>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors">
            <Upload className="w-8 h-8 text-zinc-500 mb-2" />
            <span className="text-sm text-zinc-400">Click to upload or drag and drop</span>
            <span className="text-xs text-zinc-600 mt-1">MP3, WAV, M4A up to 50MB</span>
            <input type="file" className="hidden" accept="audio/*" />
          </label>
        </div>
      </div>
    </div>
  );
}
