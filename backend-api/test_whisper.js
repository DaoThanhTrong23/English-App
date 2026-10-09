import { pipeline } from '@xenova/transformers';

async function test() {
  console.log("Loading model...");
  const transcriber = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en");
  console.log("Model loaded. Generating dummy audio...");
  const audioFloat32 = new Float32Array(16000 * 2); // 2 seconds of silence
  for(let i=0; i<audioFloat32.length; i++) {
    audioFloat32[i] = Math.sin(i / 10) * 0.5; // sine wave
  }
  console.log("Transcribing...");
  const asrResult = await transcriber(audioFloat32);
  console.log("Result:", asrResult);
}
test().catch(console.error);
