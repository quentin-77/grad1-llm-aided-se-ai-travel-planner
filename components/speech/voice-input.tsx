'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";

interface VoiceInputProps {
  isProcessing?: boolean;
  onTranscript?: (text: string) => void;
  onAudioData?: (blob: Blob) => void;
}

export function VoiceInput({
  isProcessing = false,
  onAudioData,
  onTranscript,
}: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  const resetState = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    audioChunksRef.current = [];
    setRecordingSeconds(0);
    setIsRecording(false);
  }, []);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      resetState();
    };
  }, [resetState]);

  const startRecording = useCallback(async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      mediaStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });

      mediaRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        if (onAudioData) {
          onAudioData(audioBlob);
        }

        setTranscript("语音已录入，等待识别…");
        onTranscript?.("语音已录入，等待识别…");
        resetState();
      });

      mediaRecorder.start();
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("[VoiceInput] startRecording error", error);
      setErrorMessage("无法访问麦克风，请检查浏览器权限设置。");
      resetState();
    }
  }, [onAudioData, onTranscript, resetState]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/50">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
            语音输入快速描述需求
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            长按录音将自动发送给 AI 识别，支持中文 / 英文。
          </p>
        </div>
        <button
          type="button"
          disabled={isProcessing}
          onClick={isRecording ? stopRecording : startRecording}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
            isRecording
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isRecording ? (
            <Square className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="mt-4 rounded-lg bg-white p-3 text-sm shadow-inner dark:bg-neutral-900">
        {isRecording ? (
          <p className="font-medium text-neutral-800 dark:text-neutral-100">
            正在录音… {recordingSeconds.toString().padStart(2, "0")} 秒
          </p>
        ) : (
          <p className="text-neutral-500">
            {transcript || "点击麦克风开始录音，自动识别后将填充表单。"}
          </p>
        )}
      </div>

      {errorMessage ? (
        <p className="mt-2 text-xs text-red-500">{errorMessage}</p>
      ) : null}
    </div>
  );
}
