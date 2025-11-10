'use client';

/**
 * Converts an arbitrary audio Blob (e.g. audio/webm from MediaRecorder)
 * into a 16kHz mono WAV Blob that meets Aliyun ASR requirements.
 */
export async function convertBlobTo16kMonoWav(blob: Blob): Promise<Blob> {
  if (blob.type.includes("wav") || blob.type.includes("pcm")) {
    return blob;
  }

  if (typeof AudioContext === "undefined") {
    throw new Error("当前环境不支持 AudioContext，无法转换录音格式。");
  }

  const audioContext = new AudioContext();
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const monoData = mixToMono(audioBuffer);
    const resampled = resampleToTargetRate(monoData, audioBuffer.sampleRate, 16000);
    const wavBuffer = encodeWav(resampled, 16000);
    return new Blob([wavBuffer], { type: "audio/wav" });
  } finally {
    await audioContext.close();
  }
}

function mixToMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) {
    return new Float32Array(buffer.getChannelData(0));
  }
  const length = buffer.length;
  const mono = new Float32Array(length);
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      mono[i] += channelData[i];
    }
  }
  for (let i = 0; i < length; i++) {
    mono[i] /= buffer.numberOfChannels;
  }
  return mono;
}

function resampleToTargetRate(
  samples: Float32Array,
  sourceRate: number,
  targetRate: number
): Float32Array {
  if (sourceRate === targetRate) {
    return samples;
  }
  const ratio = sourceRate / targetRate;
  const newLength = Math.round(samples.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const originIndex = i * ratio;
    const indexLow = Math.floor(originIndex);
    const indexHigh = Math.min(indexLow + 1, samples.length - 1);
    const weight = originIndex - indexLow;
    result[i] = samples[indexLow] * (1 - weight) + samples[indexHigh] * weight;
  }
  return result;
}

function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // audio format = PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i++) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}
