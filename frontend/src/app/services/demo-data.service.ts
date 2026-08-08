import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, map, shareReplay, switchMap, throwError } from 'rxjs';
import {
  Platform, ObjectMaster, Change,
  ComplexityObject, ComplexityChange,
  Catalog, CatalogItem,
  AiStatus,
} from '../models/interfaces';

interface DemoDb {
  platforms: Platform[];
  objects: ObjectMaster[];
  changes: Change[];
  complexity_objects: ComplexityObject[];
  complexity_changes: ComplexityChange[];
  catalogs: Catalog[];
  catalog_items: Array<Omit<CatalogItem,
    'platform_description' | 'platform_initial' | 'object_description' | 'object_initial' |
    'change_description' | 'change_initial' | 'complexity_object_description' |
    'complexity_object_initial' | 'complexity_change_description' | 'complexity_change_initial'
  > & Partial<CatalogItem>>;
}

const STORAGE_KEY = 'creador_catalogos_demo_db_v1';

@Injectable({ providedIn: 'root' })
export class DemoDataService {
  private db$?: Observable<DemoDb>;
  private memory: DemoDb | null = null;

  constructor(private http: HttpClient) {}

  private demoDbUrl(): string {
    const base = document.querySelector('base')?.href
      || `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, '/')}`;
    return new URL('assets/demo/db.json', base).toString();
  }

  private persist(): void {
    if (!this.memory || typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memory));
  }

  private readStored(): DemoDb | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as DemoDb : null;
    } catch {
      return null;
    }
  }

  private load(): Observable<DemoDb> {
    if (this.memory) return from([this.memory]);
    if (!this.db$) {
      this.db$ = this.http.get<DemoDb>(this.demoDbUrl()).pipe(
        map(db => {
          this.memory = this.readStored() ?? structuredClone(db);
          return this.memory!;
        }),
        shareReplay(1),
      );
    }
    return this.db$;
  }

  private nextId(ids: number[]): number {
    return (ids.length ? Math.max(...ids) : 0) + 1;
  }

  private enrichItem(db: DemoDb, item: DemoDb['catalog_items'][number]): CatalogItem {
    const platform = db.platforms.find(p => p.id === item.platform_id);
    const obj = db.objects.find(o => o.id === item.object_id);
    const change = db.changes.find(c => c.id === item.change_id);
    const co = db.complexity_objects.find(x => x.id === item.complexity_object_id);
    const cc = db.complexity_changes.find(x => x.id === item.complexity_change_id);
    return {
      id: item.id,
      catalog_id: item.catalog_id,
      platform_id: item.platform_id,
      object_id: item.object_id,
      change_id: item.change_id,
      complexity_object_id: item.complexity_object_id,
      complexity_change_id: item.complexity_change_id,
      code: item.code,
      time: item.time ?? 0,
      baja_logica: !!item.baja_logica,
      platform_description: platform?.description ?? '',
      platform_initial: platform?.initial ?? '',
      object_description: obj?.description ?? '',
      object_initial: obj?.initial ?? '',
      change_description: change?.description ?? '',
      change_initial: change?.initial ?? '',
      complexity_object_description: co?.description ?? '',
      complexity_object_initial: co?.initial ?? '',
      complexity_change_description: cc?.description ?? '',
      complexity_change_initial: cc?.initial ?? '',
    };
  }

  getPlatforms(): Observable<Platform[]> {
    return this.load().pipe(map(db => db.platforms));
  }

  getObjects(): Observable<ObjectMaster[]> {
    return this.load().pipe(map(db => db.objects));
  }

  getChanges(): Observable<Change[]> {
    return this.load().pipe(map(db => db.changes));
  }

  getComplexityObjects(): Observable<ComplexityObject[]> {
    return this.load().pipe(map(db => db.complexity_objects));
  }

  getComplexityChanges(): Observable<ComplexityChange[]> {
    return this.load().pipe(map(db => db.complexity_changes));
  }

  getCatalogs(): Observable<Catalog[]> {
    return this.load().pipe(map(db => [...db.catalogs]));
  }

  getCatalog(id: number): Observable<Catalog> {
    return this.load().pipe(
      switchMap(db => {
        const catalog = db.catalogs.find(c => c.id === id);
        return catalog
          ? from([{ ...catalog }])
          : throwError(() => ({ status: 404, error: { detail: 'Catálogo no encontrado' } }));
      }),
    );
  }

  createCatalog(data: Partial<Catalog>): Observable<Catalog> {
    return this.load().pipe(
      switchMap(db => {
        const description = (data.description || '').trim();
        const initial = (data.initial || '').trim();
        if (!description || !initial) {
          return throwError(() => ({ status: 400, error: { detail: 'Todos los campos son requeridos' } }));
        }
        if (db.catalogs.some(c => c.initial.toLowerCase() === initial.toLowerCase())) {
          return throwError(() => ({ status: 400, error: { detail: 'Ya existe un catálogo con esa sigla' } }));
        }
        const created: Catalog = {
          id: this.nextId(db.catalogs.map(c => c.id)),
          description,
          initial,
        };
        db.catalogs.push(created);
        this.persist();
        return from([{ ...created }]);
      }),
    );
  }

  updateCatalog(id: number, data: Partial<Catalog>): Observable<Catalog> {
    return this.load().pipe(
      switchMap(db => {
        const catalog = db.catalogs.find(c => c.id === id);
        if (!catalog) {
          return throwError(() => ({ status: 404, error: { detail: 'Catálogo no encontrado' } }));
        }
        const description = (data.description ?? catalog.description).trim();
        const initial = (data.initial ?? catalog.initial).trim();
        if (!description || !initial) {
          return throwError(() => ({ status: 400, error: { detail: 'Todos los campos son requeridos' } }));
        }
        if (db.catalogs.some(c => c.id !== id && c.initial.toLowerCase() === initial.toLowerCase())) {
          return throwError(() => ({ status: 400, error: { detail: 'Ya existe un catálogo con esa sigla' } }));
        }
        catalog.description = description;
        catalog.initial = initial;
        this.persist();
        return from([{ ...catalog }]);
      }),
    );
  }

  deleteCatalog(id: number): Observable<void> {
    return this.load().pipe(
      switchMap(db => {
        const idx = db.catalogs.findIndex(c => c.id === id);
        if (idx < 0) {
          return throwError(() => ({ status: 404, error: { detail: 'Catálogo no encontrado' } }));
        }
        db.catalogs.splice(idx, 1);
        db.catalog_items = db.catalog_items.filter(i => i.catalog_id !== id);
        this.persist();
        return from([undefined as void]);
      }),
    );
  }

  getCatalogItems(catalogId: number): Observable<CatalogItem[]> {
    return this.load().pipe(
      map(db => db.catalog_items
        .filter(i => i.catalog_id === catalogId)
        .map(i => this.enrichItem(db, i))),
    );
  }

  createCatalogItem(catalogId: number, data: {
    platform_id: number;
    object_id: number;
    change_id: number;
    complexity_object_id: number;
    complexity_change_id: number;
    time?: number;
  }): Observable<CatalogItem> {
    return this.load().pipe(
      switchMap(db => {
        if (!db.catalogs.some(c => c.id === catalogId)) {
          return throwError(() => ({ status: 404, error: { detail: 'Catálogo no encontrado' } }));
        }
        const platform = db.platforms.find(p => p.id === data.platform_id);
        const obj = db.objects.find(o => o.id === data.object_id);
        const change = db.changes.find(c => c.id === data.change_id);
        const co = db.complexity_objects.find(x => x.id === data.complexity_object_id);
        const cc = db.complexity_changes.find(x => x.id === data.complexity_change_id);
        if (!platform || !obj || !change || !co || !cc) {
          return throwError(() => ({ status: 400, error: { detail: 'Referencias de item inválidas' } }));
        }
        const code = `${platform.initial}${obj.initial}${change.initial}${co.initial}${cc.initial}`;
        if (db.catalog_items.some(i => i.catalog_id === catalogId && i.code === code)) {
          return throwError(() => ({
            status: 409,
            error: { detail: `Ya existe un item con el código '${code}' en este catálogo` },
          }));
        }
        const created = {
          id: this.nextId(db.catalog_items.map(i => i.id)),
          catalog_id: catalogId,
          platform_id: data.platform_id,
          object_id: data.object_id,
          change_id: data.change_id,
          complexity_object_id: data.complexity_object_id,
          complexity_change_id: data.complexity_change_id,
          code,
          time: data.time ?? 0,
          baja_logica: false,
        };
        db.catalog_items.push(created);
        this.persist();
        return from([this.enrichItem(db, created)]);
      }),
    );
  }

  updateCatalogItem(catalogId: number, itemId: number, data: { time: number }): Observable<CatalogItem> {
    return this.load().pipe(
      switchMap(db => {
        const item = db.catalog_items.find(i => i.id === itemId && i.catalog_id === catalogId);
        if (!item) {
          return throwError(() => ({ status: 404, error: { detail: 'Item no encontrado' } }));
        }
        if (item.baja_logica) {
          return throwError(() => ({ status: 400, error: { detail: 'No se puede editar un item con baja lógica' } }));
        }
        item.time = data.time ?? 0;
        this.persist();
        return from([this.enrichItem(db, item)]);
      }),
    );
  }

  activateCatalogItem(catalogId: number, itemId: number): Observable<CatalogItem> {
    return this.load().pipe(
      switchMap(db => {
        const item = db.catalog_items.find(i => i.id === itemId && i.catalog_id === catalogId);
        if (!item) {
          return throwError(() => ({ status: 404, error: { detail: 'Item no encontrado' } }));
        }
        item.baja_logica = false;
        this.persist();
        return from([this.enrichItem(db, item)]);
      }),
    );
  }

  bulkActivateCatalogItems(catalogId: number, itemIds: number[]): Observable<{ activated: number }> {
    return this.load().pipe(
      map(db => {
        let activated = 0;
        for (const id of itemIds) {
          const item = db.catalog_items.find(i => i.id === id && i.catalog_id === catalogId);
          if (item && item.baja_logica) {
            item.baja_logica = false;
            activated += 1;
          }
        }
        this.persist();
        return { activated };
      }),
    );
  }

  deleteCatalogItem(catalogId: number, itemId: number, definitiva: boolean): Observable<{ deleted?: boolean; baja_logica?: boolean }> {
    return this.load().pipe(
      switchMap(db => {
        const idx = db.catalog_items.findIndex(i => i.id === itemId && i.catalog_id === catalogId);
        if (idx < 0) {
          return throwError(() => ({ status: 404, error: { detail: 'Item no encontrado' } }));
        }
        if (definitiva) {
          db.catalog_items.splice(idx, 1);
          this.persist();
          return from([{ deleted: true }]);
        }
        db.catalog_items[idx].baja_logica = true;
        this.persist();
        return from([{ baja_logica: true }]);
      }),
    );
  }

  bulkDeleteCatalogItems(
    catalogId: number,
    itemIds: number[],
    definitiva: boolean,
  ): Observable<{ deleted?: number; baja_logica?: number }> {
    return this.load().pipe(
      map(db => {
        let count = 0;
        if (definitiva) {
          const before = db.catalog_items.length;
          db.catalog_items = db.catalog_items.filter(
            i => !(i.catalog_id === catalogId && itemIds.includes(i.id)),
          );
          count = before - db.catalog_items.length;
          this.persist();
          return { deleted: count };
        }
        for (const id of itemIds) {
          const item = db.catalog_items.find(i => i.id === id && i.catalog_id === catalogId);
          if (item && !item.baja_logica) {
            item.baja_logica = true;
            count += 1;
          }
        }
        this.persist();
        return { baja_logica: count };
      }),
    );
  }

  getAiStatus(): Observable<AiStatus> {
    return from([{
      configured: false,
      connections_count: 0,
      using_free_opensource: false,
      requires_api_key: true,
    }]);
  }

  unsupported<T>(action: string): Observable<T> {
    return throwError(() => ({
      status: 501,
      error: { detail: `Modo demo Pages: ${action} no está disponible online. Usá la app local con backend.` },
    }));
  }
}
