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
  interimResults?: boolean;
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
  interimResults = true,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionResult {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
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
    recognition.continuous = false;
    recognition.interimResults = interimResults;

    recognition.onstart = () => {
      console.log("[SR] start");
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      console.log("[SR] end");
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(event.error ?? "speech-recognition-error");
      setIsListening(false);
      console.error("[SR] error", event);
    };

    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      const results = Array.from(event.results || []);
      console.log("[SR] result", results);
      const text = results
        .map((item) => item?.[0]?.transcript ?? "")
        .filter(Boolean)
        .join("");
      setTranscript(text.trim());
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
  }, [lang, interimResults]);

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
