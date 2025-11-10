'use client';

import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionResultAlternative {
  transcript?: string;
  confidence?: number;
}

interface SpeechRecognitionResult extends Array<SpeechRecognitionResultAlternative> {
  isFinal?: boolean;
}

type SpeechRecognitionResultList = ArrayLike<SpeechRecognitionResult>;

interface SpeechRecognitionErrorEvent {
  error?: string;
}

interface SpeechRecognitionResultEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onaudiostart: (() => void) | null;
  onsoundstart: (() => void) | null;
  onsoundend: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognition;

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface UseSpeechRecognitionOptions {
  lang?: string;
  interimResults?: boolean; // 是否需要中间结果
  continuous?: boolean; // 是否连续识别
}

interface UseSpeechRecognitionResult {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
}

export function useSpeechRecognition({
  lang = "zh-CN",
  interimResults = false,
  continuous = false,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionResult {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // 语音识别功能依赖浏览器的 Web Speech API
    const RecognitionCtor =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      null;

    if (!RecognitionCtor) {
      setIsSupported(false);
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const code = event?.error;
      // 忽略无语音/用户中断等非致命错误，避免控制台噪音
      if (!code || code === "no-speech" || code === "aborted") {
        setIsListening(false);
        setError(null);
        return;
      }
      const friendly = code === "network"
        ? "network（网络不可用或服务不可达）"
        : code;
      setError(friendly || "speech-recognition-error");
      setIsListening(false);
    };

    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      if (!recognition.interimResults) {
        // 仅取一次性的最终结果，按同学示例取第一条/最后条的第一个候选
        const total = event?.results?.length || 0;
        if (!total) return;
        const idx = Math.max(0, total - 1);
        const res: any = (event.results as any)[idx];
        const best: any = res && res[0];
        const text = (best?.transcript || "").toString();
        setTranscript(text.trim());
      } else {
        const results = Array.from(event.results || []);
        const text = results
          .map((item) => (item as any)?.[0]?.transcript ?? "")
          .filter(Boolean)
          .join("");
        setTranscript(text.trim());
      }
    };

    recognitionRef.current = recognition;
    setIsSupported(true);

    return () => {
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [lang, interimResults, continuous]);

  const start = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error("[useSpeechRecognition] start failed", err);
      setError("无法启动语音识别，请检查浏览器权限。");
    }
  }, [isListening]);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch (err) {
      console.error("[useSpeechRecognition] stop failed", err);
    }
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    start,
    stop,
  };
}
