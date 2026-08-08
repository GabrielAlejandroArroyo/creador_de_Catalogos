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
