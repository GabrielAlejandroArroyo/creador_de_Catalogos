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
import { environment } from '../../environments/environment';
import { DemoDataService } from './demo-data.service';

const BASE = environment.apiBaseUrl;

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(
    private http: HttpClient,
    private demo: DemoDataService,
  ) {}

  private get useDemo(): boolean {
    if (environment.useStaticDemo) return true;
    if (typeof window === 'undefined') return false;
    return window.location.hostname.endsWith('github.io');
  }

  // --- Platforms ---
  getPlatforms(): Observable<Platform[]> {
    return this.useDemo ? this.demo.getPlatforms() : this.http.get<Platform[]>(`${BASE}/platforms/`);
  }
  createPlatform(data: Partial<Platform>): Observable<Platform> {
    return this.useDemo ? this.demo.unsupported('crear plataforma') : this.http.post<Platform>(`${BASE}/platforms/`, data);
  }
  updatePlatform(id: number, data: Partial<Platform>): Observable<Platform> {
    return this.useDemo ? this.demo.unsupported('editar plataforma') : this.http.put<Platform>(`${BASE}/platforms/${id}`, data);
  }
  deletePlatform(id: number): Observable<void> {
    return this.useDemo ? this.demo.unsupported('eliminar plataforma') : this.http.delete<void>(`${BASE}/platforms/${id}`);
  }

  // --- Objects ---
  getObjects(): Observable<ObjectMaster[]> {
    return this.useDemo ? this.demo.getObjects() : this.http.get<ObjectMaster[]>(`${BASE}/objects/`);
  }
  createObject(data: Partial<ObjectMaster>): Observable<ObjectMaster> {
    return this.useDemo ? this.demo.unsupported('crear objeto') : this.http.post<ObjectMaster>(`${BASE}/objects/`, data);
  }
  updateObject(id: number, data: Partial<ObjectMaster>): Observable<ObjectMaster> {
    return this.useDemo ? this.demo.unsupported('editar objeto') : this.http.put<ObjectMaster>(`${BASE}/objects/${id}`, data);
  }
  deleteObject(id: number): Observable<void> {
    return this.useDemo ? this.demo.unsupported('eliminar objeto') : this.http.delete<void>(`${BASE}/objects/${id}`);
  }

  // --- Changes ---
  getChanges(): Observable<Change[]> {
    return this.useDemo ? this.demo.getChanges() : this.http.get<Change[]>(`${BASE}/changes/`);
  }
  createChange(data: Partial<Change>): Observable<Change> {
    return this.useDemo ? this.demo.unsupported('crear cambio') : this.http.post<Change>(`${BASE}/changes/`, data);
  }
  updateChange(id: number, data: Partial<Change>): Observable<Change> {
    return this.useDemo ? this.demo.unsupported('editar cambio') : this.http.put<Change>(`${BASE}/changes/${id}`, data);
  }
  deleteChange(id: number): Observable<void> {
    return this.useDemo ? this.demo.unsupported('eliminar cambio') : this.http.delete<void>(`${BASE}/changes/${id}`);
  }

  // --- ComplexityObject ---
  getComplexityObjects(): Observable<ComplexityObject[]> {
    return this.useDemo
      ? this.demo.getComplexityObjects()
      : this.http.get<ComplexityObject[]>(`${BASE}/complexity-objects/`);
  }
  createComplexityObject(data: Partial<ComplexityObject>): Observable<ComplexityObject> {
    return this.useDemo
      ? this.demo.unsupported('crear complejidad objeto')
      : this.http.post<ComplexityObject>(`${BASE}/complexity-objects/`, data);
  }
  updateComplexityObject(id: number, data: Partial<ComplexityObject>): Observable<ComplexityObject> {
    return this.useDemo
      ? this.demo.unsupported('editar complejidad objeto')
      : this.http.put<ComplexityObject>(`${BASE}/complexity-objects/${id}`, data);
  }
  deleteComplexityObject(id: number): Observable<void> {
    return this.useDemo
      ? this.demo.unsupported('eliminar complejidad objeto')
      : this.http.delete<void>(`${BASE}/complexity-objects/${id}`);
  }

  // --- ComplexityChange ---
  getComplexityChanges(): Observable<ComplexityChange[]> {
    return this.useDemo
      ? this.demo.getComplexityChanges()
      : this.http.get<ComplexityChange[]>(`${BASE}/complexity-changes/`);
  }
  createComplexityChange(data: Partial<ComplexityChange>): Observable<ComplexityChange> {
    return this.useDemo
      ? this.demo.unsupported('crear complejidad cambio')
      : this.http.post<ComplexityChange>(`${BASE}/complexity-changes/`, data);
  }
  updateComplexityChange(id: number, data: Partial<ComplexityChange>): Observable<ComplexityChange> {
    return this.useDemo
      ? this.demo.unsupported('editar complejidad cambio')
      : this.http.put<ComplexityChange>(`${BASE}/complexity-changes/${id}`, data);
  }
  deleteComplexityChange(id: number): Observable<void> {
    return this.useDemo
      ? this.demo.unsupported('eliminar complejidad cambio')
      : this.http.delete<void>(`${BASE}/complexity-changes/${id}`);
  }

  // --- Catalogs ---
  getCatalogs(): Observable<Catalog[]> {
    return this.useDemo ? this.demo.getCatalogs() : this.http.get<Catalog[]>(`${BASE}/catalogs/`);
  }
  createCatalog(data: Partial<Catalog>): Observable<Catalog> {
    return this.useDemo ? this.demo.createCatalog(data) : this.http.post<Catalog>(`${BASE}/catalogs/`, data);
  }
  updateCatalog(id: number, data: Partial<Catalog>): Observable<Catalog> {
    return this.useDemo ? this.demo.updateCatalog(id, data) : this.http.put<Catalog>(`${BASE}/catalogs/${id}`, data);
  }
  deleteCatalog(id: number): Observable<void> {
    return this.useDemo ? this.demo.deleteCatalog(id) : this.http.delete<void>(`${BASE}/catalogs/${id}`);
  }
  getCatalog(id: number): Observable<Catalog> {
    return this.useDemo ? this.demo.getCatalog(id) : this.http.get<Catalog>(`${BASE}/catalogs/${id}`);
  }

  // --- CatalogItems ---
  getCatalogItems(catalogId: number): Observable<CatalogItem[]> {
    return this.useDemo
      ? this.demo.getCatalogItems(catalogId)
      : this.http.get<CatalogItem[]>(`${BASE}/catalogs/${catalogId}/items/`);
  }
  createCatalogItem(catalogId: number, data: any): Observable<CatalogItem> {
    return this.useDemo
      ? this.demo.unsupported('crear item')
      : this.http.post<CatalogItem>(`${BASE}/catalogs/${catalogId}/items/`, data);
  }
  updateCatalogItem(catalogId: number, itemId: number, data: any): Observable<CatalogItem> {
    return this.useDemo
      ? this.demo.unsupported('editar item')
      : this.http.put<CatalogItem>(`${BASE}/catalogs/${catalogId}/items/${itemId}`, data);
  }
  activateCatalogItem(catalogId: number, itemId: number): Observable<CatalogItem> {
    return this.useDemo
      ? this.demo.unsupported('activar item')
      : this.http.post<CatalogItem>(`${BASE}/catalogs/${catalogId}/items/${itemId}/activar`, {});
  }
  bulkActivateCatalogItems(catalogId: number, itemIds: number[]): Observable<{ activated: number }> {
    return this.useDemo
      ? this.demo.unsupported('activar items')
      : this.http.post<{ activated: number }>(`${BASE}/catalogs/${catalogId}/items/bulk-activate`, {
          item_ids: itemIds,
        });
  }
  deleteCatalogItem(catalogId: number, itemId: number, definitiva: boolean): Observable<any> {
    return this.useDemo
      ? this.demo.unsupported('eliminar item')
      : this.http.delete<any>(`${BASE}/catalogs/${catalogId}/items/${itemId}`, {
          params: { definitiva: String(definitiva) },
        });
  }
  bulkDeleteCatalogItems(catalogId: number, itemIds: number[], definitiva: boolean): Observable<any> {
    return this.useDemo
      ? this.demo.unsupported('eliminar items')
      : this.http.post<any>(`${BASE}/catalogs/${catalogId}/items/bulk-delete`, {
          item_ids: itemIds,
          definitiva,
        });
  }

  // --- AI assistant ---
  getAiStatus(): Observable<AiStatus> {
    return this.useDemo ? this.demo.getAiStatus() : this.http.get<AiStatus>(`${BASE}/ai/status`);
  }
  getAiConnections(): Observable<AiConnection[]> {
    return this.useDemo ? this.demo.unsupported('listar conexiones IA') : this.http.get<AiConnection[]>(`${BASE}/ai/connections`);
  }
  createAiConnection(data: AiConnectionCreate): Observable<AiConnection> {
    return this.useDemo ? this.demo.unsupported('crear conexión IA') : this.http.post<AiConnection>(`${BASE}/ai/connections`, data);
  }
  updateAiConnection(id: number, data: AiConnectionUpdate): Observable<AiConnection> {
    return this.useDemo ? this.demo.unsupported('editar conexión IA') : this.http.put<AiConnection>(`${BASE}/ai/connections/${id}`, data);
  }
  activateAiConnection(id: number): Observable<AiConnection> {
    return this.useDemo
      ? this.demo.unsupported('activar conexión IA')
      : this.http.post<AiConnection>(`${BASE}/ai/connections/${id}/activate`, {});
  }
  deleteAiConnection(id: number): Observable<void> {
    return this.useDemo ? this.demo.unsupported('eliminar conexión IA') : this.http.delete<void>(`${BASE}/ai/connections/${id}`);
  }
  testAiConnection(id: number): Observable<AiTestResponse> {
    return this.useDemo
      ? this.demo.unsupported('probar conexión IA')
      : this.http.post<AiTestResponse>(`${BASE}/ai/connections/${id}/test`, {});
  }
  useFreeOpensourceAi(): Observable<AiConnection> {
    return this.useDemo
      ? this.demo.unsupported('IA open source')
      : this.http.post<AiConnection>(`${BASE}/ai/connections/use-free-opensource`, {});
  }
  aiChat(data: AiChatRequest): Observable<AiChatResponse> {
    return this.useDemo ? this.demo.unsupported('chat IA') : this.http.post<AiChatResponse>(`${BASE}/ai/chat`, data);
  }
}
