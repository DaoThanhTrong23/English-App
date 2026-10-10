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
  } catch(e) {
    return audioBuffer;
  } finally {
    if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
    if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
  }
}
`;

code = code.replace(
  /class AiService \{/,
  ffmpegLogic + "\nclass AiService {"
);

fs.writeFileSync('backend-api/src/module/AI/ai.service.ts', code);
