const fs = require('fs');
let code = fs.readFileSync('backend-api/src/module/AI/ai.service.ts', 'utf8');

code = code.replace(
  /let whisperPipeline: any = null;\s*async function getWhisperPipeline\(\) \{[\s\S]*?return whisperPipeline;\s*\}/,
  `let whisperPipeline: any = null;
  let whisperInitPromise: Promise<any> | null = null;
  
  async function getWhisperPipeline() {
    if (whisperPipeline) return whisperPipeline;
    if (whisperInitPromise) return await whisperInitPromise;
    
    whisperInitPromise = (async () => {
      loggers.info("[Whisper ASR] Đang khởi tạo mô hình nhận diện âm học Whisper...");
      const model = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en");
      loggers.info("[Whisper ASR] Khởi tạo mô hình Whisper thành công!");
      return model;
    })();
    
    whisperPipeline = await whisperInitPromise;
    return whisperPipeline;
  }`
);

fs.writeFileSync('backend-api/src/module/AI/ai.service.ts', code);
