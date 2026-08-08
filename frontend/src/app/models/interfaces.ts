export interface Platform {
  id: number;
  description: string;
  initial: string;
}

export interface ObjectMaster {
  id: number;
  description: string;
  initial: string;
  platform_ids: number[];
}

export interface Change {
  id: number;
  description: string;
  initial: string;
}

export interface ComplexityObject {
  id: number;
  description: string;
  initial: string;
}

export interface ComplexityChange {
  id: number;
  description: string;
  initial: string;
}

export interface Catalog {
  id: number;
  description: string;
  initial: string;
}

export interface CatalogItem {
  id: number;
  catalog_id: number;
  platform_id: number;
  object_id: number;
  change_id: number;
  complexity_object_id: number;
  complexity_change_id: number;
  code: string;
  time: number;
  baja_logica: boolean;
  platform_description: string;
  platform_initial: string;
  object_description: string;
  object_initial: string;
  change_description: string;
  change_initial: string;
  complexity_object_description: string;
  complexity_object_initial: string;
  complexity_change_description: string;
  complexity_change_initial: string;
}

export type AiMode = 'foundational' | 'foundational_rag';

export interface AiConnection {
  id: number;
  name: string;
  base_url: string;
  api_key_masked: string;
  model_name: string;
  mode: AiMode;
  is_active: boolean;
  is_enabled: boolean;
  updated_at?: string | null;
}

export interface AiConnectionCreate {
  name: string;
  base_url: string;
  api_key?: string;
  model_name: string;
  mode: AiMode;
  is_enabled?: boolean;
  activate?: boolean;
}

export interface AiConnectionUpdate {
  name?: string;
  base_url?: string;
  api_key?: string;
  model_name?: string;
  mode?: AiMode;
  is_enabled?: boolean;
}

export type AiProviderKind = 'custom' | 'ollama_free' | 'rag_offline';

export interface AiStatus {
  configured: boolean;
  active_connection_id?: number | null;
  active_connection_name?: string | null;
  mode?: AiMode | null;
  model_name?: string | null;
  connections_count: number;
  provider_kind?: AiProviderKind;
  using_free_opensource?: boolean;
  requires_api_key?: boolean;
}

export interface AiChatRequest {
  message: string;
  concept?: string | null;
}

export interface AiChatResponse {
  reply: string;
  mode: AiMode;
  connection_name: string;
  model_name: string;
  sources: string[];
  provider_kind?: AiProviderKind;
}

export interface AiTestResponse {
  ok: boolean;
  detail: string;
}
