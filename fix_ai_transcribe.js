const fs = require('fs');
let code = fs.readFileSync('backend-api/src/module/AI/ai.service.ts', 'utf8');

const ffmpegLogic = `
async function convertAnyAudioToWavBuffer(audioBuffer: Buffer): Promise<Buffer> {
  const tempInput = path.join(os.tmpdir(), \`input_\${Date.now()}_\${Math.random().toString(36).slice(2)}\`);
  const tempOutput = path.join(os.tmpdir(), \`output_\${Date.now()}_\${Math.random().toString(36).slice(2)}.wav\`);
  try {
    fs.writeFileSync(tempInput, audioBuffer);
    const ffmpegBin = (typeof ffmpegPath === "string" ? ffmpegPath : (ffmpegPath as any)?.default) || "ffmpeg";
    await execFileAsync(ffmpegBin, [
      "-y",
      "-i", tempInput,
      "-ar", "16000",
      "-ac", "1",
      "-c:a", "pcm_s16le",
      tempOutput,
    ]);
    return fs.readFileSync(tempOutput);
  } finally {
    if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
    if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
  }
}
`;

// Insert the new function after normalizeAudioToWav
code = code.replace(
  /function normalizeAudioToWav[\s\S]*?return audioBuffer;\n  \}\n\}/,
  (match) => match + "\n\n" + ffmpegLogic
);

// Modify transcribeAudioLocal to use convertAnyAudioToWavBuffer
code = code.replace(
  /const normalizedBuffer = normalizeAudioToWav\(audioBuffer\);/,
  "const normalizedBuffer = await convertAnyAudioToWavBuffer(audioBuffer);"
);

fs.writeFileSync('backend-api/src/module/AI/ai.service.ts', code);
