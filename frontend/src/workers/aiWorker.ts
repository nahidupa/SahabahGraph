import { pipeline, env } from '@huggingface/transformers';

// Skip local check as we're in a browser environment
env.allowLocalModels = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let generator: any = null;

async function init(modelId: string, backend: 'webgpu' | 'wasm' = 'wasm', forceReload: boolean = false) {
  // Force reload if backend changed or explicitly requested
  if (forceReload && generator) {
    console.log('🔧 Worker: Force reloading model for backend switch');
    generator = null;
  }
  
  if (!generator) {
    self.postMessage({ type: 'status', message: `Loading model (${backend.toUpperCase()})...` });

    const config: any = {
      device: backend,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      progress_callback: (progress: any) => {
        self.postMessage({ type: 'progress', progress });
      },
    };

    // Use 8-bit quantization for WASM to save memory
    if (backend === 'wasm') {
      config.dtype = 'q8';
    }

    generator = await pipeline('text-generation', modelId, config);

    self.postMessage({ type: 'ready' });
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { type, data } = e.data;

  if (type === 'init') {
    try {
      // Use Qwen2.5-0.5B-Instruct - small but capable chat model
      const backend = data.backend || 'wasm';
      const forceReload = data.forceReload || false;
      await init(data.modelId || 'onnx-community/Qwen2.5-0.5B-Instruct', backend, forceReload);
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
      const { messages, max_new_tokens = 128 } = data; // Reduced to save memory

      console.log('🔧 Worker: Generating response...', { messages, max_new_tokens });

      // For chat models with proper templates
      const output = await generator(messages, {
        max_new_tokens,
        temperature: 0.7,
        top_p: 0.9,
        do_sample: false, // Deterministic to save memory
      });

      console.log('🔧 Worker: Raw output:', output);

      // Extract the assistant's response
      let result;
      if (Array.isArray(output) && output[0]?.generated_text) {
        const generatedText = output[0].generated_text;
        console.log('🔧 Worker: Generated text:', generatedText);
        
        if (Array.isArray(generatedText)) {
          // Chat format: array of message objects
          const lastMessage = generatedText[generatedText.length - 1];
          result = lastMessage.content || lastMessage;
          console.log('🔧 Worker: Extracted from array:', result);
        } else {
          // String format
          result = generatedText;
          console.log('🔧 Worker: String format:', result);
        }
      } else {
        result = 'No response generated';
        console.warn('🔧 Worker: Unexpected output format:', output);
      }

      console.log('🔧 Worker: Final result:', result);

      self.postMessage({
        type: 'result',
        result
      });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('🔧 Worker: Generation error:', error);
      self.postMessage({ type: 'error', error: error.message || 'Generation failed' });
    }
  }
};
