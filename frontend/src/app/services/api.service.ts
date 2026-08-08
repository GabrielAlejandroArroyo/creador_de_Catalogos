import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Platform, ObjectMaster, Change,
  ComplexityObject, ComplexityChange,
  Catalog, CatalogItem,
  AiConnection, AiConnectionCreate, AiConnectionUpdate,
  AiStatus, AiChatRequest, AiChatResponse, AiTestResponse,
} from '../models/interfaces';

const BASE = 'http://localhost:8000/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // --- Platforms ---
  getPlatforms(): Observable<Platform[]> { return this.http.get<Platform[]>(`${BASE}/platforms/`); }
  createPlatform(data: Partial<Platform>): Observable<Platform> { return this.http.post<Platform>(`${BASE}/platforms/`, data); }
  updatePlatform(id: number, data: Partial<Platform>): Observable<Platform> { return this.http.put<Platform>(`${BASE}/platforms/${id}`, data); }
  deletePlatform(id: number): Observable<void> { return this.http.delete<void>(`${BASE}/platforms/${id}`); }

  // --- Objects ---
  getObjects(): Observable<ObjectMaster[]> { return this.http.get<ObjectMaster[]>(`${BASE}/objects/`); }
  createObject(data: Partial<ObjectMaster>): Observable<ObjectMaster> { return this.http.post<ObjectMaster>(`${BASE}/objects/`, data); }
  updateObject(id: number, data: Partial<ObjectMaster>): Observable<ObjectMaster> { return this.http.put<ObjectMaster>(`${BASE}/objects/${id}`, data); }
  deleteObject(id: number): Observable<void> { return this.http.delete<void>(`${BASE}/objects/${id}`); }

  // --- Changes ---
  getChanges(): Observable<Change[]> { return this.http.get<Change[]>(`${BASE}/changes/`); }
  createChange(data: Partial<Change>): Observable<Change> { return this.http.post<Change>(`${BASE}/changes/`, data); }
  updateChange(id: number, data: Partial<Change>): Observable<Change> { return this.http.put<Change>(`${BASE}/changes/${id}`, data); }
  deleteChange(id: number): Observable<void> { return this.http.delete<void>(`${BASE}/changes/${id}`); }

  // --- ComplexityObject ---
  getComplexityObjects(): Observable<ComplexityObject[]> { return this.http.get<ComplexityObject[]>(`${BASE}/complexity-objects/`); }
  createComplexityObject(data: Partial<ComplexityObject>): Observable<ComplexityObject> { return this.http.post<ComplexityObject>(`${BASE}/complexity-objects/`, data); }
  updateComplexityObject(id: number, data: Partial<ComplexityObject>): Observable<ComplexityObject> { return this.http.put<ComplexityObject>(`${BASE}/complexity-objects/${id}`, data); }
  deleteComplexityObject(id: number): Observable<void> { return this.http.delete<void>(`${BASE}/complexity-objects/${id}`); }

  // --- ComplexityChange ---
  getComplexityChanges(): Observable<ComplexityChange[]> { return this.http.get<ComplexityChange[]>(`${BASE}/complexity-changes/`); }
  createComplexityChange(data: Partial<ComplexityChange>): Observable<ComplexityChange> { return this.http.post<ComplexityChange>(`${BASE}/complexity-changes/`, data); }
  updateComplexityChange(id: number, data: Partial<ComplexityChange>): Observable<ComplexityChange> { return this.http.put<ComplexityChange>(`${BASE}/complexity-changes/${id}`, data); }
  deleteComplexityChange(id: number): Observable<void> { return this.http.delete<void>(`${BASE}/complexity-changes/${id}`); }

  // --- Catalogs ---
  getCatalogs(): Observable<Catalog[]> { return this.http.get<Catalog[]>(`${BASE}/catalogs/`); }
  createCatalog(data: Partial<Catalog>): Observable<Catalog> { return this.http.post<Catalog>(`${BASE}/catalogs/`, data); }
  updateCatalog(id: number, data: Partial<Catalog>): Observable<Catalog> { return this.http.put<Catalog>(`${BASE}/catalogs/${id}`, data); }
  deleteCatalog(id: number): Observable<void> { return this.http.delete<void>(`${BASE}/catalogs/${id}`); }
  getCatalog(id: number): Observable<Catalog> { return this.http.get<Catalog>(`${BASE}/catalogs/${id}`); }

  // --- CatalogItems ---
  getCatalogItems(catalogId: number): Observable<CatalogItem[]> { return this.http.get<CatalogItem[]>(`${BASE}/catalogs/${catalogId}/items/`); }
  createCatalogItem(catalogId: number, data: any): Observable<CatalogItem> { return this.http.post<CatalogItem>(`${BASE}/catalogs/${catalogId}/items/`, data); }
  updateCatalogItem(catalogId: number, itemId: number, data: any): Observable<CatalogItem> { return this.http.put<CatalogItem>(`${BASE}/catalogs/${catalogId}/items/${itemId}`, data); }
  activateCatalogItem(catalogId: number, itemId: number): Observable<CatalogItem> {
    return this.http.post<CatalogItem>(`${BASE}/catalogs/${catalogId}/items/${itemId}/activar`, {});
  }
  bulkActivateCatalogItems(catalogId: number, itemIds: number[]): Observable<{ activated: number }> {
    return this.http.post<{ activated: number }>(`${BASE}/catalogs/${catalogId}/items/bulk-activate`, {
      item_ids: itemIds,
    });
  }
  deleteCatalogItem(catalogId: number, itemId: number, definitiva: boolean): Observable<any> {
    return this.http.delete<any>(`${BASE}/catalogs/${catalogId}/items/${itemId}`, {
      params: { definitiva: String(definitiva) },
    });
  }
  bulkDeleteCatalogItems(catalogId: number, itemIds: number[], definitiva: boolean): Observable<any> {
    return this.http.post<any>(`${BASE}/catalogs/${catalogId}/items/bulk-delete`, {
      item_ids: itemIds,
      definitiva,
    });
  }

  // --- AI assistant ---
  getAiStatus(): Observable<AiStatus> {
    return this.http.get<AiStatus>(`${BASE}/ai/status`);
  }
  getAiConnections(): Observable<AiConnection[]> {
    return this.http.get<AiConnection[]>(`${BASE}/ai/connections`);
  }
  createAiConnection(data: AiConnectionCreate): Observable<AiConnection> {
    return this.http.post<AiConnection>(`${BASE}/ai/connections`, data);
  }
  updateAiConnection(id: number, data: AiConnectionUpdate): Observable<AiConnection> {
    return this.http.put<AiConnection>(`${BASE}/ai/connections/${id}`, data);
  }
  activateAiConnection(id: number): Observable<AiConnection> {
    return this.http.post<AiConnection>(`${BASE}/ai/connections/${id}/activate`, {});
  }
  deleteAiConnection(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/ai/connections/${id}`);
  }
  testAiConnection(id: number): Observable<AiTestResponse> {
    return this.http.post<AiTestResponse>(`${BASE}/ai/connections/${id}/test`, {});
  }
  useFreeOpensourceAi(): Observable<AiConnection> {
    return this.http.post<AiConnection>(`${BASE}/ai/connections/use-free-opensource`, {});
  }
  aiChat(data: AiChatRequest): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>(`${BASE}/ai/chat`, data);
  }
}
