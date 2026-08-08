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

  private load(): Observable<DemoDb> {
    if (this.memory) return from([this.memory]);
    if (!this.db$) {
      this.db$ = this.http.get<DemoDb>(this.demoDbUrl()).pipe(
        map(db => {
          this.memory = structuredClone(db);
          return this.memory!;
        }),
        shareReplay(1),
      );
    }
    return this.db$;
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
    return this.load().pipe(map(db => db.catalogs));
  }

  getCatalog(id: number): Observable<Catalog> {
    return this.load().pipe(
      switchMap(db => {
        const catalog = db.catalogs.find(c => c.id === id);
        return catalog
          ? from([catalog])
          : throwError(() => ({ status: 404, error: { detail: 'Catálogo no encontrado' } }));
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
