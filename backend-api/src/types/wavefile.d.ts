declare module 'wavefile' {
  export class WaveFile {
    constructor(buffer?: Buffer);
    toSampleRate(rate: number, method?: { method: string }): void;
    toBitDepth(bitDepth: string): void;
    toBuffer(): Buffer;
    getSamples(interleaved?: boolean, type?: any): any;
    fromScratch(numChannels: number, sampleRate: number, bitDepth: string, samples: any, options?: any): void;
  }
}
