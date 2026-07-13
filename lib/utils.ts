import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function sanitizeText(text: string) {
  return text.replace("<has_function_call>", "");
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

/**
 * Maps an AI model name to its corresponding company's SVG icon filename.
 * @param modelName The name of the AI model.
 * @returns The SVG filename (e.g., 'openai.svg') or 'fallback.svg' if no match is found.
 */
export function getCompanySvg(modelName: string): string {
  const lowerModelName = modelName.toLowerCase();

  // Define mappings for companies and their models (matches start of string, or following slashes, hyphens, or underscores)
  const companyMappings: { regex: RegExp; svg: string }[] = [
    // OpenAI
    { regex: /(?:^|[\/\-_])(gpt|dall-e|whisper|clip|embedding|codex|instructgpt|ada|babbage|curie|davinci)/, svg: "openai.svg" },
    // Google (Gemini)
    { regex: /(?:^|[\/\-_])(gemini|gemma|palm|bard|flan|bert|t5|lambda|imagen|videofx|musicfx|gemini-pro|gemini-flash|gemini-ultra|gemini-nano|gemini-omni)/, svg: "gemini.svg" },
    // Anthropic (Claude)
    { regex: /(?:^|[\/\-_])(claude|claude-instant|claude-haiku|claude-sonnet|claude-opus)/, svg: "claude.svg" },
    // Microsoft
    { regex: /(?:^|[\/\-_])(microsoft|mai|phi|turing|deepspeed)/, svg: "microsoft.svg" },
    // Meta (Llama)
    { regex: /(?:^|[\/\-_])(llama|opt|blenderbot|galactica|codellama|llama-guard|llama-v|llama-scout|llama-maverick)/, svg: "meta.svg" },
    // Mistral AI
    { regex: /(?:^|[\/\-_])(mistral|mixtral|codestral|pixtral|nemo|leanstral)/, svg: "mistral.svg" },
    // Cohere
    { regex: /(?:^|[\/\-_])(command|cohere|aya|embed|rerank)/, svg: "cohere.svg" },
    // DeepSeek
    { regex: /(?:^|[\/\-_])(deepseek|deepseek-v3|deepseek-coder|deepseek-vl|deepseek-r1|deepseek-janus|deepseek-moe)/, svg: "deepseek.svg" },
    // Kimi (Moonshot AI)
    { regex: /(?:^|[\/\-_])(kimi)/, svg: "kimi.svg" },
    // Poolside
    { regex: /(?:^|[\/\-_])(laguna|poolside)/, svg: "poolside.svg" },
    // Qwen (Alibaba)
    { regex: /(?:^|[\/\-_])(qwen|qwen-vl|qwen-audio|qwen-coder|qwen2)/, svg: "qwen.svg" },
    // Grok (xAI)
    { regex: /(?:^|[\/\-_])(grok)/, svg: "grok.svg" },
    // Hugging Face
    { regex: /(?:^|[\/\-_])(huggingface|hf)/, svg: "hugging_face.svg" },
    // Midjourney
    { regex: /(?:^|[\/\-_])(midjourney)/, svg: "midjourney.svg" },
    // NVIDIA
    { regex: /(?:^|[\/\-_])(nemotron|nvlm|edify|fugatto|cosmos)/, svg: "nvidia.svg" },
    // Perplexity
    { regex: /(?:^|[\/\-_])(sonar|perplexity|sonar-small|sonar-medium|sonar-large|sonar-huge)/, svg: "perplexity.svg" },
    // Tencent (Hunyuan)
    { regex: /(?:^|[\/\-_])(hunyuan|tencent|hunyuan-video|hunyuan-dit|hunyuan-a13b|hy3)/, svg: "tencent.svg" },
  ];

  for (const mapping of companyMappings) {
    if (mapping.regex.test(lowerModelName)) {
      return mapping.svg;
    }
  }

  // Fallback for unknown models
  return "fallback.svg"; // Assuming a generic fallback SVG exists
}
