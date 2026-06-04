import { pipeline, env } from '@huggingface/transformers';

// Skip local check as we're in a browser environment
env.allowLocalModels = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let generator: any = null;

async function init(modelId: string) {
  if (!generator) {
    self.postMessage({ type: 'status', message: 'Loading model...' });

    generator = await pipeline('text-generation', modelId, {
      device: 'webgpu', // Try WebGPU first
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      progress_callback: (progress: any) => {
        self.postMessage({ type: 'progress', progress });
      },
    });

    self.postMessage({ type: 'ready' });
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { type, data } = e.data;

  if (type === 'init') {
    try {
      await init(data.modelId || 'onnx-community/Qwen2.5-0.5B-Instruct');
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
