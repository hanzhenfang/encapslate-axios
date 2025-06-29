/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface ImportMetaEnv {
  readonly VITE_DEV_URL: string
  readonly VITE_PROD_URL: string
  // more env variables...
}
