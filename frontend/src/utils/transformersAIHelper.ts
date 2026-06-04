export class TransformersAIHelper {
  private worker: Worker | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private onProgress: ((progress: any) => void) | null = null;
  private onReady: (() => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  private resolvePrompt: ((value: string) => void) | null = null;

  constructor() {
    // Don't initialize worker in constructor - do it lazily when init() is called
  }

  private initWorker() {
    if (this.worker) return; // Already initialized
    
    try {
      this.worker = new Worker(new URL('../workers/aiWorker.ts', import.meta.url), {
        type: 'module'
      });
    } catch (error) {
      console.error('Failed to create AI worker:', error);
      if (this.onError) {
        this.onError('Failed to initialize AI worker');
      }
      return;
    }

    this.worker.onmessage = (e) => {
      const { type, progress, result, error } = e.data;

      switch (type) {
        case 'progress':
          if (this.onProgress) this.onProgress(progress);
          break;
        case 'ready':
          if (this.onReady) this.onReady();
          break;
        case 'result':
          if (this.resolvePrompt) {
            this.resolvePrompt(result);
            this.resolvePrompt = null;
          }
          break;
        case 'error':
          if (this.onError) this.onError(error);
          if (this.resolvePrompt) {
            this.resolvePrompt('Error: ' + error);
            this.resolvePrompt = null;
          }
          break;
      }
    };
  }

  async checkWebGPUSupport(): Promise<boolean> {
    if (!navigator.gpu) return false;
    try {
      const adapter = await navigator.gpu.requestAdapter();
      return !!adapter;
    } catch {
      return false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  init(onProgress: (progress: any) => void, onReady: () => void, onError: (error: string) => void) {
    this.onProgress = onProgress;
    this.onReady = onReady;
    this.onError = onError;
    
    // Initialize worker lazily
    this.initWorker();
    
    if (!this.worker) {
      onError('Worker initialization failed');
      return;
    }
    
    // Use smaller, faster GPT-2 model (~1MB instead of 500MB)
    this.worker.postMessage({ type: 'init', data: { modelId: 'Xenova/gpt2' } });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async prompt(messages: any[]): Promise<string> {
    return new Promise((resolve) => {
      this.resolvePrompt = resolve;
      this.worker?.postMessage({ type: 'generate', data: { messages } });
    });
  }

  destroy() {
    this.worker?.terminate();
    this.worker = null;
  }
}
