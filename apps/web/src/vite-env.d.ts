/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Administrator (phòng đào tạo) contact email used by the app footer's "Quản trị" mailto link. */
  readonly VITE_ADMIN_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
