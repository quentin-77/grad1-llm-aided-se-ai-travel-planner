'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { useSpeechRecognition } from "@/components/speech/use-speech-recognition";

interface VoiceInputProps {
  isProcessing?: boolean;
  onTranscript?: (text: string) => void;
  transcript?: string;
  onListeningChange?: (active: boolean) => void;
  onAudioData?: (blob: Blob) => void;
}

export function VoiceInput({
  isProcessing = false,
  onTranscript,
  onListeningChange,
  onAudioData,
  transcript: externalTranscript,
}: VoiceInputProps) {
  const { isSupported, isListening, transcript, error, start, stop } = useSpeechRecognition({
    lang: "zh-CN",
    interimResults: true,
  });
  const [internalTranscript, setInternalTranscript] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  const displayTranscript = externalTranscript && externalTranscript.length > 0
    ? externalTranscript
    : internalTranscript;

  useEffect(() => {
    if (!transcript) return;
    setInternalTranscript(transcript);
    onTranscript?.(transcript);
  }, [transcript, onTranscript]);

  useEffect(() => {
    onListeningChange?.(isListening);
  }, [isListening, onListeningChange]);

  useEffect(() => {
    // 如果 Web Speech 不支持或出现网络错误，向上报告“处理中”以驱动 UI
    if (!isSupported || error === "network") {
      onListeningChange?.(isRecording);
    }
  }, [isSupported, error, isRecording, onListeningChange]);

  const statusText = useMemo(() => {
    if (!isSupported) {
      return "当前浏览器暂不支持 Web Speech API，请更换 Chrome 或使用文字输入。";
    }
    if (isListening) {
      return "正在识别语音…请清晰描述您的出行需求。";
    }
    return displayTranscript || "点击麦克风开始实时语音识别，结果会自动填充表单。";
  }, [displayTranscript, isListening, isSupported]);

  const handleToggle = () => {
    if (isProcessing) return;
    // 优先尝试浏览器识别；若不支持或已出现 network 错误，则启用录音回退
    const preferRecording = !isSupported || error === "network";
    if (preferRecording) {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
      return;
    }

    if (isListening) {
      stop();
    } else {
      start();
      setInternalTranscript("");
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      });
      mediaRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        onAudioData?.(audioBlob);
        cleanupRecorder();
      });

      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
      setIsRecording(true);
      onListeningChange?.(true);
      mediaRecorder.start();
    } catch (err) {
      console.error("[VoiceInput] fallback recording start error", err);
      setIsRecording(false);
      onListeningChange?.(false);
    }
  }, [onAudioData, onListeningChange]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    setIsRecording(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    onListeningChange?.(false);
  }, [onListeningChange]);

  const cleanupRecorder = () => {
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  };

  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/50">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
            语音输入快速描述需求
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            借助浏览器内置语音识别，无需额外配置，支持中文 / 英文。
          </p>
        </div>
        <button
          type="button"
          disabled={isProcessing || !isSupported}
          onClick={handleToggle}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
            isListening
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isListening ? (
            <Square className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="mt-4 rounded-lg bg-white p-3 text-sm shadow-inner dark:bg-neutral-900">
        {isRecording ? (
          <p className="font-medium text-neutral-800 dark:text-neutral-100">
            正在录音… {recordingSeconds.toString().padStart(2, "0")} 秒（将自动上传至云端识别）
          </p>
        ) : (
          <p className="text-neutral-500 dark:text-neutral-300">{statusText}</p>
        )}
      </div>

      {!isSupported ? (
        <p className="mt-2 text-xs text-red-500">
          当前环境无法访问 SpeechRecognition，建议在 Chrome 桌面浏览器中打开。
        </p>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs text-red-500">
          语音识别出错：{error}
        </p>
      ) : null}
    </div>
  );
}
