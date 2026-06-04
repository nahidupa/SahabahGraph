import { pipeline, env } from '@huggingface/transformers';

// Skip local check as we're in a browser environment
env.allowLocalModels = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let generator: any = null;

async function init(modelId: string) {
  if (!generator) {
    self.postMessage({ type: 'status', message: 'Loading model...' });

    try {
      // Try WebGPU first, fall back to WASM if not available
      generator = await pipeline('text-generation', modelId, {
        device: 'webgpu',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        progress_callback: (progress: any) => {
          self.postMessage({ type: 'progress', progress });
        },
      });
    } catch (webgpuError) {
      console.warn('WebGPU failed, falling back to WASM:', webgpuError);
      // Fallback to CPU/WASM if WebGPU fails
      generator = await pipeline('text-generation', modelId, {
        device: 'wasm',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        progress_callback: (progress: any) => {
          self.postMessage({ type: 'progress', progress });
        },
      });
    }

    self.postMessage({ type: 'ready' });
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { type, data } = e.data;

  if (type === 'init') {
    try {
      // Use smaller, faster model (GPT-2 ~1MB instead of Qwen 500MB)
      await init(data.modelId || 'Xenova/gpt2');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      self.postMessage({ type: 'error', error: error.message });
    }
  } else if (type === 'generate') {
    if (!generator) {
      self.postMessage({ type: 'error', error: 'Model not initialized' });
      return;
    }

    try {
      const { messages, max_new_tokens = 512 } = data;

      const output = await generator(messages, {
        max_new_tokens,
      });

      self.postMessage({
        type: 'result',
        result: output[0].generated_text[output[0].generated_text.length - 1].content
      });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      self.postMessage({ type: 'error', error: error.message });
    }
  }
};
