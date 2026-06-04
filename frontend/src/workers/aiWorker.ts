import { pipeline, env } from '@huggingface/transformers';

// Skip local check as we're in a browser environment
env.allowLocalModels = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let generator: any = null;

async function init(modelId: string, backend: 'webgpu' | 'wasm' = 'wasm', forceReload: boolean = false) {
  try {
    // Force reload if backend changed or explicitly requested
    if (forceReload || generator) {
      console.log('🔧 Worker: Cleaning up previous model (forceReload=', forceReload, ')');
      // Dispose of old generator to free memory
      if (generator && generator.dispose) {
        try {
          generator.dispose();
        } catch (e) {
          console.log('🔧 Worker: Error disposing generator:', e);
        }
      }
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

      // Use quantization to reduce memory usage
      // WebGPU: Use 4-bit quantization for lower memory (still faster than WASM)
      //         Note: Even with q4, some systems may still run out of memory
      //         The system will automatically fallback to WASM if WebGPU OOM occurs
      // WASM: Use 4-bit quantization (aggressive compression for maximum memory savings)
      //       This is slower but should fit on most systems
      config.dtype = 'q4'; // 4-bit quantization for both backends to minimize memory

      console.log('🔧 Worker: Creating pipeline with config:', config);
      generator = await pipeline('text-generation', modelId, config);
      console.log('🔧 Worker: Pipeline created successfully');

      self.postMessage({ type: 'ready' });
    }
  } catch (error: any) {
    // Clean up on error
    console.log('🔧 Worker: Error during init, cleaning up generator');
    generator = null;
    throw error; // Re-throw to be caught by caller
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { type, data } = e.data;

  if (type === 'init') {
    try {
      // Use Qwen2.5-0.5B-Instruct - small but capable chat model
      const backend = data.backend || 'wasm';
      const forceReload = data.forceReload || false;
      
      console.log('🔧 Worker: Init requested with backend=', backend, 'forceReload=', forceReload);
      
      await init(data.modelId || 'onnx-community/Qwen2.5-0.5B-Instruct', backend, forceReload);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorText = error.message || error.toString() || '';
      const isOOM = errorText.includes('bad_alloc') || errorText.includes('OOM') || errorText.includes('out of memory');
      
      console.log('🔧 Worker: Init error caught, errorText=', errorText, 'isOOM=', isOOM, 'backend=', data.backend);
      
      // Ensure generator is cleaned up after error
      generator = null;
      
      // If WebGPU fails with OOM, suggest fallback to WASM
      if (isOOM && data.backend === 'webgpu') {
        console.log('🔧 Worker: Sending OOM error with suggestFallback=true');
        self.postMessage({ 
          type: 'error', 
          error: errorText,
          suggestFallback: true // Signal to UI that WASM fallback is recommended
        });
      } else {
        self.postMessage({ type: 'error', error: errorText });
      }
    }
  } else if (type === 'generate') {
    if (!generator) {
      self.postMessage({ type: 'error', error: 'Model not initialized' });
      return;
    }

    try {
      const { messages, max_new_tokens = 64 } = data; // Reduced to 64 to save memory

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
  } else if (type === 'dispose') {
    // Dispose of the model to free memory
    console.log('🔧 Worker: Dispose requested');
    if (generator && generator.dispose) {
      try {
        generator.dispose();
        console.log('🔧 Worker: Generator disposed successfully');
      } catch (e) {
        console.log('🔧 Worker: Error disposing generator:', e);
      }
    }
    generator = null;
    self.postMessage({ type: 'disposed' });
  }
};
