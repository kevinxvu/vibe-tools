type RuntimeConfig = {
  API_BASE_URL?: string;
  APP_ID?: string;
  MARKDOWN_API_URL?: string;
  MARKDOWN_API_KEY?: string;
};

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeConfig;
  }
}

const runtimeConfig = window.__APP_CONFIG__ ?? {};

export const getRuntimeConfig = (key: keyof RuntimeConfig): string => {
  return runtimeConfig[key] || '';
};
