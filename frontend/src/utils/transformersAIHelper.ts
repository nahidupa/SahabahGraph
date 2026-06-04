export class TransformersAIHelper {
  private worker: Worker | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private onProgress: ((progress: any) => void) | null = null;
  private onReady: (() => void) | null = null;
  private onError: ((error: string, suggestFallback?: boolean) => void) | null = null;
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
      const { type, progress, result, error, suggestFallback } = e.data;

      console.log('🔧 Helper: Received message from worker:', type, e.data);

      switch (type) {
        case 'progress':
          if (this.onProgress) this.onProgress(progress);
          break;
        case 'ready':
          console.log('🔧 Helper: Model ready!');
          if (this.onReady) this.onReady();
          break;
        case 'result':
          console.log('🔧 Helper: Got result:', result);
          if (this.resolvePrompt) {
            this.resolvePrompt(result);
            this.resolvePrompt = null;
          }
          break;
        case 'error':
          console.error('🔧 Helper: Got error:', error, 'suggestFallback:', suggestFallback);
          // If WebGPU OOM, append suggestion to error message
          const errorMsg = suggestFallback 
            ? `${error}\n\n⚠️ WebGPU ran out of memory. The system will automatically switch to WASM mode (slower but uses less memory).`
            : error;
          if (this.onError) {
            console.log('🔧 Helper: Calling onError with suggestFallback=', suggestFallback);
            this.onError(errorMsg, suggestFallback);
          }
          if (this.resolvePrompt) {
            this.resolvePrompt('Error: ' + errorMsg);
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
  init(onProgress: (progress: any) => void, onReady: () => void, onError: (error: string, suggestFallback?: boolean) => void, backend: 'webgpu' | 'wasm' = 'wasm', forceReload: boolean = false) {
    this.onProgress = onProgress;
    this.onReady = onReady;
    this.onError = onError;
    
    // Initialize worker lazily
    this.initWorker();
    
    if (!this.worker) {
      onError('Worker initialization failed');
      return;
    }
    
    console.log(`🔧 Helper: Initializing with backend=${backend}, forceReload=${forceReload}`);
    
    // Use Qwen2.5-0.5B-Instruct - small chat model with proper chat template support
    // This model is ~300MB but supports conversation format properly
    this.worker.postMessage({ 
      type: 'init', 
      data: { 
        modelId: 'onnx-community/Qwen2.5-0.5B-Instruct',
        backend,
        forceReload 
      } 
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async prompt(messages: any[]): Promise<string> {
    console.log('🔧 Helper: Sending prompt to worker:', messages);
    
    if (!this.worker) {
      console.error('🔧 Helper: Worker not initialized!');
      throw new Error('Worker not initialized');
    }
    
    return new Promise((resolve) => {
      this.resolvePrompt = resolve;
      
      // Add timeout to catch hanging requests
      const timeout = setTimeout(() => {
        console.error('🔧 Helper: Prompt timeout after 30 seconds');
        if (this.resolvePrompt) {
          this.resolvePrompt('Request timed out. Please try again.');
          this.resolvePrompt = null;
        }
      }, 30000); // 30 second timeout
      
      // Wrap resolve to clear timeout
      const originalResolve = this.resolvePrompt;
      this.resolvePrompt = (value: string) => {
        clearTimeout(timeout);
        originalResolve(value);
      };
      
      // Worker is guaranteed to exist here (checked above)
      this.worker!.postMessage({ type: 'generate', data: { messages } });
      console.log('🔧 Helper: Message sent to worker');
    });
  }

  destroy() {
    this.worker?.terminate();
    this.worker = null;
  }
}
