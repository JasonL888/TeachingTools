import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

env.allowLocalModels = false;

const MODEL_ID = 'Xenova/LaMini-Flan-T5-248M';

let paraphraser = null;
let loadingPromise = null;

async function getParaphraser() {
  if (paraphraser) return paraphraser;
  if (!loadingPromise) {
    loadingPromise = pipeline('text2text-generation', MODEL_ID, {
      progress_callback: (data) => self.postMessage({ type: 'progress', data }),
    });
  }
  paraphraser = await loadingPromise;
  return paraphraser;
}

self.onmessage = async (event) => {
  const { type, id, payload } = event.data;
  try {
    if (type === 'load') {
      await getParaphraser();
      self.postMessage({ type: 'done', id });
    } else if (type === 'generate') {
      const model = await getParaphraser();
      const output = await model(payload.prompt, payload.options);
      self.postMessage({ type: 'done', id, result: output[0].generated_text });
    }
  } catch (err) {
    self.postMessage({ type: 'error', id, message: err.message });
  }
};
