import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { from, concatMap, toArray } from 'rxjs';
import { ApiService } from '../../services/api.service';
import {
  Catalog, CatalogItem, Platform, ObjectMaster,
  Change, ComplexityObject, ComplexityChange,
} from '../../models/interfaces';

interface PreviewCode {
  code: string;
  exists: boolean;
  objectId: number;
  changeId: number;
  complexityObjectId: number;
  complexityChangeId: number;
}

interface PreviewTreeNode {
  key: string;
  label: string;
  level: 'platform' | 'object' | 'change' | 'complexity';
  children?: PreviewTreeNode[];
  codes?: PreviewCode[];
  codeCount: number;
  conflictCount: number;
}

interface ItemsTreeNode {
  key: string;
  label: string;
  level: 'platform' | 'object' | 'change' | 'complexity';
  itemCount: number;
  bajaCount: number;
  children?: ItemsTreeNode[];
  items?: CatalogItem[];
}

type BajaFilter = 'all' | 'yes' | 'no';

@Component({
  selector: 'app-catalog-items',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="header-row">
        <button (click)="goBack()" class="btn btn-secondary">← Volver</button>
        <h1>Items del Catálogo: <span class="catalog-name">{{ catalog?.description }}</span>
          <span class="badge-cat">{{ catalog?.initial }}</span>
        </h1>
      </div>

      <div class="card">
        <h3>{{ editing ? 'Editar Time' : 'Nuevo Item' }}</h3>

        <!-- Modo edición: solo Time -->
        <div *ngIf="editing" class="edit-time-box">
          <div class="code-preview">
            <label>Código (no editable):</label>
            <span class="code-value">{{ editCodePreview }}</span>
          </div>
          <div class="field time-field">
            <label>Time</label>
            <input type="number" step="any" [(ngModel)]="timeValue" class="select input-time" />
          </div>
        </div>

        <!-- Modo creación -->
        <ng-container *ngIf="!editing">
          <div class="field">
            <label>Plataforma</label>
            <select [(ngModel)]="platformId" (ngModelChange)="onPlatformChange()" class="select select-platform">
              <option [ngValue]="0">-- Seleccionar --</option>
              <option *ngFor="let p of platforms" [ngValue]="p.id">{{ p.description }} ({{ p.initial }})</option>
            </select>
          </div>

          <div class="multi-grid" *ngIf="showObjeto">
            <div class="field" *ngIf="showObjeto">
              <label>Objeto <span class="hint">(múltiple)</span></label>
              <div class="checkbox-box" *ngIf="filteredObjects.length; else noObjects">
                <label *ngFor="let o of filteredObjects" class="checkbox-label">
                  <input type="checkbox" [checked]="selectedObjectIds.has(o.id)" (change)="toggleObject(o.id)" />
                  {{ o.description }} ({{ o.initial }})
                </label>
              </div>
              <ng-template #noObjects><p class="muted">Sin objetos para esta plataforma</p></ng-template>
            </div>

            <div class="field" *ngIf="showCambio">
              <label>Cambio <span class="hint">(múltiple)</span></label>
              <div class="checkbox-box">
                <label *ngFor="let c of changes" class="checkbox-label">
                  <input type="checkbox" [checked]="selectedChangeIds.has(c.id)" (change)="toggleChange(c.id)" />
                  {{ c.description }} ({{ c.initial }})
                </label>
              </div>
            </div>

            <div class="field" *ngIf="showComplejidadObjeto">
              <label>Complejidad Objeto <span class="hint">(múltiple)</span></label>
              <div class="checkbox-box">
                <label *ngFor="let co of complexityObjects" class="checkbox-label">
                  <input type="checkbox" [checked]="selectedComplexityObjectIds.has(co.id)" (change)="toggleComplexityObject(co.id)" />
                  {{ co.description }} ({{ co.initial }})
                </label>
              </div>
            </div>

            <div class="field" *ngIf="showComplejidadCambio">
              <label>Complejidad Cambio <span class="hint">(múltiple)</span></label>
              <div class="checkbox-box">
                <label *ngFor="let cc of complexityChanges" class="checkbox-label">
                  <input type="checkbox" [checked]="selectedComplexityChangeIds.has(cc.id)" (change)="toggleComplexityChange(cc.id)" />
                  {{ cc.description }} ({{ cc.initial }})
                </label>
              </div>
            </div>
          </div>

          <div class="code-preview" *ngIf="previewTree" [class.has-conflicts]="activeConflictCount > 0">
            <button type="button" class="preview-header" (click)="togglePreviewPanel()">
              <span class="preview-chevron">{{ previewPanelCollapsed ? '▶' : '▼' }}</span>
              <span class="preview-title">Códigos a generar</span>
              <span class="preview-count">{{ includedCodes.length }}</span>
              <span *ngIf="activeConflictCount > 0" class="preview-conflict-badge">
                {{ activeConflictCount }} conflicto{{ activeConflictCount === 1 ? '' : 's' }}
              </span>
              <span *ngIf="excludedCodes.size" class="preview-excluded-badge">
                {{ excludedCodes.size }} excluido{{ excludedCodes.size === 1 ? '' : 's' }}
              </span>
              <span class="preview-toggle-hint">{{ previewPanelCollapsed ? 'Expandir' : 'Colapsar' }}</span>
            </button>

            <div *ngIf="!previewPanelCollapsed" class="preview-body">
              <div class="preview-actions" *ngIf="existingCount > 0">
                <button type="button" class="btn btn-secondary btn-sm" (click)="excludeAllConflicts()">
                  Excluir todos los conflictos
                </button>
              </div>
              <ul class="code-tree">
                <li>
                  <button type="button" class="tree-node level-platform" (click)="toggleTreeNode(previewTree.key)">
                    <span class="tree-chevron">{{ isTreeCollapsed(previewTree.key) ? '▶' : '▼' }}</span>
                    <span class="tree-level-tag">Plataforma</span>
                    <span class="tree-label">{{ previewTree.label }}</span>
                    <span class="tree-meta">{{ previewTree.codeCount }} cód.</span>
                    <span *ngIf="previewTree.conflictCount" class="tree-conflict-meta">{{ previewTree.conflictCount }} conf.</span>
                  </button>
                  <ul *ngIf="!isTreeCollapsed(previewTree.key)">
                    <li *ngFor="let obj of previewTree.children">
                      <button type="button" class="tree-node level-object" (click)="toggleTreeNode(obj.key)">
                        <span class="tree-chevron">{{ isTreeCollapsed(obj.key) ? '▶' : '▼' }}</span>
                        <span class="tree-level-tag">Objeto</span>
                        <span class="tree-label">{{ obj.label }}</span>
                        <span class="tree-meta">{{ obj.codeCount }} cód.</span>
                        <span *ngIf="obj.conflictCount" class="tree-conflict-meta">{{ obj.conflictCount }} conf.</span>
                      </button>
                      <ul *ngIf="!isTreeCollapsed(obj.key)">
                        <li *ngFor="let change of obj.children">
                          <button type="button" class="tree-node level-change" (click)="toggleTreeNode(change.key)">
                            <span class="tree-chevron">{{ isTreeCollapsed(change.key) ? '▶' : '▼' }}</span>
                            <span class="tree-level-tag">Cambio</span>
                            <span class="tree-label">{{ change.label }}</span>
                            <span class="tree-meta">{{ change.codeCount }} cód.</span>
                            <span *ngIf="change.conflictCount" class="tree-conflict-meta">{{ change.conflictCount }} conf.</span>
                          </button>
                          <ul *ngIf="!isTreeCollapsed(change.key)">
                            <li *ngFor="let co of change.children">
                              <button type="button" class="tree-node level-complexity" (click)="toggleTreeNode(co.key)">
                                <span class="tree-chevron">{{ isTreeCollapsed(co.key) ? '▶' : '▼' }}</span>
                                <span class="tree-level-tag">Complej. Obj.</span>
                                <span class="tree-label">{{ co.label }}</span>
                                <span class="tree-meta">{{ co.codeCount }} cód.</span>
                                <span *ngIf="co.conflictCount" class="tree-conflict-meta">{{ co.conflictCount }} conf.</span>
                              </button>
                              <div class="code-list" *ngIf="!isTreeCollapsed(co.key)">
                                <label
                                  *ngFor="let c of co.codes"
                                  class="code-chip"
                                  [class.code-conflict]="c.exists && isCodeIncluded(c.code)"
                                  [class.code-excluded]="!isCodeIncluded(c.code)"
                                  [title]="c.exists
                                    ? (isCodeIncluded(c.code) ? 'Conflicto: desmarque para excluirlo' : 'Excluido del alta')
                                    : (isCodeIncluded(c.code) ? c.code : 'Excluido del alta')">
                                  <input
                                    type="checkbox"
                                    [checked]="isCodeIncluded(c.code)"
                                    (change)="toggleCodeInclusion(c.code)"
                                  />
                                  <span>{{ c.code }}</span>
                                  <em *ngIf="c.exists && isCodeIncluded(c.code)" class="conflict-tag">conflicto</em>
                                  <em *ngIf="!isCodeIncluded(c.code)" class="excluded-tag">excluido</em>
                                </label>
                              </div>
                            </li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </li>
              </ul>

              <p *ngIf="activeConflictCount > 0" class="code-warning">
                {{ activeConflictCount }} código(s) en conflicto aún seleccionados.
                Desmarque el checkbox del código (o use “Excluir todos los conflictos”) para poder dar de alta el resto.
              </p>
              <p *ngIf="activeConflictCount === 0 && excludedCodes.size > 0" class="code-ok-hint">
                Conflictos resueltos por exclusión. Se darán de alta {{ includedCodes.length }} código(s).
              </p>
            </div>
          </div>
        </ng-container>

        <div class="form-row" style="margin-top: 16px;">
          <button (click)="save()" class="btn btn-primary" [disabled]="!isFormValid() || saving">
            {{ editing ? 'Actualizar Time' : (saving ? 'Guardando...' : 'Agregar Items') }}
          </button>
          <button *ngIf="editing" (click)="cancelEdit()" class="btn btn-secondary">Cancelar</button>
          <button *ngIf="!editing && hasSelection" (click)="clearSelection()" class="btn btn-secondary">Limpiar</button>
        </div>
        <p *ngIf="error" class="error">{{ error }}</p>
        <p *ngIf="success" class="success">{{ success }}</p>
      </div>

      <div class="card items-card">
        <div class="items-header">
          <div class="items-title-block">
            <h3>
              Items ({{ itemsViewMode === 'summary' ? filteredItems.length : items.length }}
              <span *ngIf="itemsViewMode === 'summary' && filteredItems.length !== items.length"> / {{ items.length }}</span>)
            </h3>
            <div class="view-toggle" role="group" aria-label="Modo de visualización">
              <button
                type="button"
                class="view-toggle-btn"
                [class.active]="itemsViewMode === 'full'"
                (click)="setItemsViewMode('full')">
                Vista completa
              </button>
              <button
                type="button"
                class="view-toggle-btn"
                [class.active]="itemsViewMode === 'summary'"
                (click)="setItemsViewMode('summary')">
                Vista resumida
              </button>
              <button
                type="button"
                class="view-toggle-btn"
                [class.active]="itemsViewMode === 'db'"
                (click)="setItemsViewMode('db')">
                Vista base de datos
              </button>
              <button
                type="button"
                class="view-toggle-btn"
                [class.active]="itemsViewMode === 'db_detail'"
                (click)="setItemsViewMode('db_detail')">
                Vista base de datos detallada
              </button>
            </div>
          </div>
          <div class="items-actions" *ngIf="!isDbReadOnlyView">
            <span *ngIf="selectedItemIds.size" class="selection-count">{{ selectedItemIds.size }} seleccionado(s)</span>
            <ng-container *ngIf="itemsViewMode === 'summary'">
              <button type="button" class="btn btn-secondary btn-sm" (click)="expandAllItemsTree()" [disabled]="!itemsTree.length">Expandir todo</button>
              <button type="button" class="btn btn-secondary btn-sm" (click)="collapseAllItemsTree()" [disabled]="!itemsTree.length">Colapsar todo</button>
            </ng-container>
            <button
              (click)="activateSelection()"
              class="btn btn-success"
              [disabled]="!selectedActivateIds.size || activating">
              {{ activating ? 'Activando...' : 'Activar selección' }}
              <span *ngIf="selectedActivateIds.size"> ({{ selectedActivateIds.size }})</span>
            </button>
            <button
              (click)="deleteSelection()"
              class="btn btn-danger"
              [disabled]="!selectedItemIds.size || deleting">
              {{ deleting ? 'Eliminando...' : 'Eliminar selección' }}
              <span *ngIf="selectedItemIds.size"> ({{ selectedItemIds.size }})</span>
            </button>
          </div>
        </div>

        <!-- Vista completa: tabla plana sin filtros -->
        <ng-container *ngIf="itemsViewMode === 'full'">
          <p class="view-hint muted">Lista completa de items, sin filtros ni agrupación.</p>
          <div class="table-wrap items-table-wrap" *ngIf="items.length; else noItemsFull">
            <table class="table full-table">
              <thead>
                <tr>
                  <th class="col-check">
                    <input
                      type="checkbox"
                      [checked]="allSelected"
                      [indeterminate]="someSelected && !allSelected"
                      (change)="toggleSelectAll($event)"
                      title="Seleccionar todos los activos (Baja lógica = No)"
                      [disabled]="!activeItems.length"
                    />
                  </th>
                  <th>Código</th>
                  <th>Plataforma</th>
                  <th>Objeto</th>
                  <th>Cambio</th>
                  <th>Complej. Objeto</th>
                  <th>Complej. Cambio</th>
                  <th>Time</th>
                  <th>Baja lógica</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of items"
                    [class.row-selected]="selectedItemIds.has(item.id)"
                    [class.row-baja]="item.baja_logica">
                  <td class="col-check">
                    <input
                      *ngIf="!item.baja_logica"
                      type="checkbox"
                      [checked]="selectedItemIds.has(item.id)"
                      (change)="toggleItem(item.id)"
                      title="Seleccionar para eliminar"
                    />
                  </td>
                  <td><span class="code-badge">{{ item.code }}</span></td>
                  <td>{{ item.platform_description }} <span class="badge-sm">{{ item.platform_initial }}</span></td>
                  <td>{{ item.object_description }} <span class="badge-sm">{{ item.object_initial }}</span></td>
                  <td>{{ item.change_description }} <span class="badge-sm">{{ item.change_initial }}</span></td>
                  <td>{{ item.complexity_object_description }} <span class="badge-sm">{{ item.complexity_object_initial }}</span></td>
                  <td>{{ item.complexity_change_description }} <span class="badge-sm">{{ item.complexity_change_initial }}</span></td>
                  <td>{{ item.time }}</td>
                  <td>
                    <span *ngIf="item.baja_logica" class="badge-baja">Sí</span>
                    <span *ngIf="!item.baja_logica" class="badge-ok">No</span>
                  </td>
                  <td class="actions-cell">
                    <button *ngIf="!item.baja_logica" (click)="edit(item)" class="btn-icon" title="Editar">✏️</button>
                    <span *ngIf="item.baja_logica" class="activate-check">
                      <input
                        type="checkbox"
                        [checked]="selectedActivateIds.has(item.id)"
                        (change)="toggleActivateSelect(item.id)"
                        title="Seleccionar para Activar selección"
                      />
                      <button type="button" (click)="activate(item)" class="btn-activate" title="Activar este item">Activar</button>
                    </span>
                    <button (click)="remove(item)" class="btn-icon" title="Eliminar">🗑️</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ng-template #noItemsFull><p class="empty">Sin items en este catálogo</p></ng-template>
        </ng-container>

        <!-- Vista base de datos: columnas crudas de catalog_items (solo lectura) -->
        <ng-container *ngIf="itemsViewMode === 'db'">
          <p class="view-hint muted">
            Solo visualización. Datos tal como están en la tabla <code>catalog_items</code> (IDs y valores almacenados, sin enriquecer).
          </p>
          <div class="table-wrap items-table-wrap" *ngIf="items.length; else noItemsDb">
            <table class="table db-table">
              <thead>
                <tr>
                  <th>id</th>
                  <th>catalog_id</th>
                  <th>platform_id</th>
                  <th>object_id</th>
                  <th>change_id</th>
                  <th>complexity_object_id</th>
                  <th>complexity_change_id</th>
                  <th>code</th>
                  <th>time</th>
                  <th>baja_logica</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of items" [class.row-baja]="item.baja_logica">
                  <td class="db-cell">{{ item.id }}</td>
                  <td class="db-cell">{{ item.catalog_id }}</td>
                  <td class="db-cell">{{ item.platform_id }}</td>
                  <td class="db-cell">{{ item.object_id }}</td>
                  <td class="db-cell">{{ item.change_id }}</td>
                  <td class="db-cell">{{ item.complexity_object_id }}</td>
                  <td class="db-cell">{{ item.complexity_change_id }}</td>
                  <td><span class="code-badge">{{ item.code }}</span></td>
                  <td class="db-cell">{{ item.time }}</td>
                  <td class="db-cell">{{ item.baja_logica ? 1 : 0 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ng-template #noItemsDb><p class="empty">Sin items en este catálogo</p></ng-template>
        </ng-container>

        <!-- Vista base de datos detallada: FKs + descripción del maestro (solo lectura) -->
        <ng-container *ngIf="itemsViewMode === 'db_detail'">
          <p class="view-hint muted">
            Solo visualización. IDs de <code>catalog_items</code> con la referencia externa y la descripción del maestro relacionado.
          </p>
          <div class="table-wrap items-table-wrap" *ngIf="items.length; else noItemsDbDetail">
            <table class="table db-table db-detail-table">
              <thead>
                <tr>
                  <th>id</th>
                  <th>catalog_id</th>
                  <th>platform_id</th>
                  <th>plataforma (maestro)</th>
                  <th>object_id</th>
                  <th>objeto (maestro)</th>
                  <th>change_id</th>
                  <th>cambio (maestro)</th>
                  <th>complexity_object_id</th>
                  <th>complej. objeto (maestro)</th>
                  <th>complexity_change_id</th>
                  <th>complej. cambio (maestro)</th>
                  <th>code</th>
                  <th>time</th>
                  <th>baja_logica</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of items" [class.row-baja]="item.baja_logica">
                  <td class="db-cell">{{ item.id }}</td>
                  <td class="db-cell">{{ item.catalog_id }}</td>
                  <td class="db-cell">{{ item.platform_id }}</td>
                  <td>
                    <span class="fk-desc">{{ item.platform_description }}</span>
                    <span class="badge-sm">{{ item.platform_initial }}</span>
                  </td>
                  <td class="db-cell">{{ item.object_id }}</td>
                  <td>
                    <span class="fk-desc">{{ item.object_description }}</span>
                    <span class="badge-sm">{{ item.object_initial }}</span>
                  </td>
                  <td class="db-cell">{{ item.change_id }}</td>
                  <td>
                    <span class="fk-desc">{{ item.change_description }}</span>
                    <span class="badge-sm">{{ item.change_initial }}</span>
                  </td>
                  <td class="db-cell">{{ item.complexity_object_id }}</td>
                  <td>
                    <span class="fk-desc">{{ item.complexity_object_description }}</span>
                    <span class="badge-sm">{{ item.complexity_object_initial }}</span>
                  </td>
                  <td class="db-cell">{{ item.complexity_change_id }}</td>
                  <td>
                    <span class="fk-desc">{{ item.complexity_change_description }}</span>
                    <span class="badge-sm">{{ item.complexity_change_initial }}</span>
                  </td>
                  <td><span class="code-badge">{{ item.code }}</span></td>
                  <td class="db-cell">{{ item.time }}</td>
                  <td class="db-cell">{{ item.baja_logica ? 1 : 0 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ng-template #noItemsDbDetail><p class="empty">Sin items en este catálogo</p></ng-template>
        </ng-container>

        <!-- Vista resumida: jerarquía + filtros -->
        <ng-container *ngIf="itemsViewMode === 'summary'">
        <p class="view-hint muted">Agrupación jerárquica con filtros. Expandí un nivel para ver la grilla del grupo.</p>
        <div class="items-filters" *ngIf="items.length">
          <div class="filter-field">
            <label>Código</label>
            <input class="input" type="search" [(ngModel)]="itemFilters.code" placeholder="Buscar código..." />
          </div>
          <div class="filter-field">
            <label>Plataforma</label>
            <select class="select" [(ngModel)]="itemFilters.platformId">
              <option [ngValue]="0">Todas</option>
              <option *ngFor="let o of filterPlatformOptions" [ngValue]="o.id">{{ o.label }}</option>
            </select>
          </div>
          <div class="filter-field">
            <label>Objeto</label>
            <select class="select" [(ngModel)]="itemFilters.objectId">
              <option [ngValue]="0">Todos</option>
              <option *ngFor="let o of filterObjectOptions" [ngValue]="o.id">{{ o.label }}</option>
            </select>
          </div>
          <div class="filter-field">
            <label>Cambio</label>
            <select class="select" [(ngModel)]="itemFilters.changeId">
              <option [ngValue]="0">Todos</option>
              <option *ngFor="let o of filterChangeOptions" [ngValue]="o.id">{{ o.label }}</option>
            </select>
          </div>
          <div class="filter-field">
            <label>Complej. Objeto</label>
            <select class="select" [(ngModel)]="itemFilters.complexityObjectId">
              <option [ngValue]="0">Todas</option>
              <option *ngFor="let o of filterComplexityObjectOptions" [ngValue]="o.id">{{ o.label }}</option>
            </select>
          </div>
          <div class="filter-field">
            <label>Complej. Cambio</label>
            <select class="select" [(ngModel)]="itemFilters.complexityChangeId">
              <option [ngValue]="0">Todas</option>
              <option *ngFor="let o of filterComplexityChangeOptions" [ngValue]="o.id">{{ o.label }}</option>
            </select>
          </div>
          <div class="filter-field">
            <label>Baja lógica</label>
            <select class="select" [(ngModel)]="itemFilters.baja">
              <option value="all">Todas</option>
              <option value="no">No</option>
              <option value="yes">Sí</option>
            </select>
          </div>
          <div class="filter-actions">
            <button type="button" class="btn btn-secondary btn-sm" (click)="clearItemFilters()" [disabled]="!hasItemFilters">Limpiar filtros</button>
          </div>
        </div>

        <p *ngIf="!items.length" class="empty">Sin items en este catálogo</p>
        <p *ngIf="items.length && !filteredItems.length" class="empty">Ningún item coincide con los filtros</p>

        <ul class="items-tree" *ngIf="itemsTree.length">
          <li *ngFor="let platform of itemsTree">
            <button type="button" class="tree-node level-platform" (click)="toggleItemsTreeNode(platform.key)">
              <span class="tree-chevron">{{ isItemsTreeCollapsed(platform.key) ? '▶' : '▼' }}</span>
              <span class="tree-level-tag">Plataforma</span>
              <span class="tree-label">{{ platform.label }}</span>
              <span class="tree-meta">{{ platform.itemCount }} items</span>
              <span *ngIf="platform.bajaCount" class="tree-baja-meta">{{ platform.bajaCount }} baja</span>
            </button>
            <ul *ngIf="!isItemsTreeCollapsed(platform.key)">
              <li *ngFor="let obj of platform.children">
                <button type="button" class="tree-node level-object" (click)="toggleItemsTreeNode(obj.key)">
                  <span class="tree-chevron">{{ isItemsTreeCollapsed(obj.key) ? '▶' : '▼' }}</span>
                  <span class="tree-level-tag">Objeto</span>
                  <span class="tree-label">{{ obj.label }}</span>
                  <span class="tree-meta">{{ obj.itemCount }} items</span>
                  <span *ngIf="obj.bajaCount" class="tree-baja-meta">{{ obj.bajaCount }} baja</span>
                </button>
                <ul *ngIf="!isItemsTreeCollapsed(obj.key)">
                  <li *ngFor="let change of obj.children">
                    <button type="button" class="tree-node level-change" (click)="toggleItemsTreeNode(change.key)">
                      <span class="tree-chevron">{{ isItemsTreeCollapsed(change.key) ? '▶' : '▼' }}</span>
                      <span class="tree-level-tag">Cambio</span>
                      <span class="tree-label">{{ change.label }}</span>
                      <span class="tree-meta">{{ change.itemCount }} items</span>
                      <span *ngIf="change.bajaCount" class="tree-baja-meta">{{ change.bajaCount }} baja</span>
                    </button>
                    <ul *ngIf="!isItemsTreeCollapsed(change.key)">
                      <li *ngFor="let co of change.children">
                        <button type="button" class="tree-node level-complexity" (click)="toggleItemsTreeNode(co.key)">
                          <span class="tree-chevron">{{ isItemsTreeCollapsed(co.key) ? '▶' : '▼' }}</span>
                          <span class="tree-level-tag">Complej. Obj.</span>
                          <span class="tree-label">{{ co.label }}</span>
                          <span class="tree-meta">{{ co.itemCount }} items</span>
                          <span *ngIf="co.bajaCount" class="tree-baja-meta">{{ co.bajaCount }} baja</span>
                        </button>

                        <div class="items-leaf" *ngIf="!isItemsTreeCollapsed(co.key)">
                          <div class="leaf-toolbar">
                            <label class="leaf-select-all">
                              <input
                                type="checkbox"
                                [checked]="isGroupAllSelected(co.items || [])"
                                [indeterminate]="isGroupSomeSelected(co.items || []) && !isGroupAllSelected(co.items || [])"
                                (change)="toggleGroupSelect($event, co.items || [])"
                                [disabled]="!groupActiveItems(co.items || []).length"
                              />
                              Seleccionar grupo
                            </label>
                            <span class="selection-count">{{ co.itemCount }} en esta grilla</span>
                          </div>
                          <div class="table-wrap items-table-wrap">
                            <table class="table leaf-table">
                              <thead>
                                <tr>
                                  <th class="col-check"></th>
                                  <th>Código</th>
                                  <th>Complej. Cambio</th>
                                  <th>Time</th>
                                  <th>Baja lógica</th>
                                  <th>Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr *ngFor="let item of co.items"
                                    [class.row-selected]="selectedItemIds.has(item.id)"
                                    [class.row-baja]="item.baja_logica">
                                  <td class="col-check">
                                    <input
                                      *ngIf="!item.baja_logica"
                                      type="checkbox"
                                      [checked]="selectedItemIds.has(item.id)"
                                      (change)="toggleItem(item.id)"
                                      title="Seleccionar para eliminar"
                                    />
                                  </td>
                                  <td><span class="code-badge">{{ item.code }}</span></td>
                                  <td>{{ item.complexity_change_description }} <span class="badge-sm">{{ item.complexity_change_initial }}</span></td>
                                  <td>{{ item.time }}</td>
                                  <td>
                                    <span *ngIf="item.baja_logica" class="badge-baja">Sí</span>
                                    <span *ngIf="!item.baja_logica" class="badge-ok">No</span>
                                  </td>
                                  <td class="actions-cell">
                                    <button *ngIf="!item.baja_logica" (click)="edit(item)" class="btn-icon" title="Editar">✏️</button>
                                    <span *ngIf="item.baja_logica" class="activate-check">
                                      <input
                                        type="checkbox"
                                        [checked]="selectedActivateIds.has(item.id)"
                                        (change)="toggleActivateSelect(item.id)"
                                        title="Seleccionar para Activar selección"
                                      />
                                      <button type="button" (click)="activate(item)" class="btn-activate" title="Activar este item">Activar</button>
                                    </span>
                                    <button (click)="remove(item)" class="btn-icon" title="Eliminar">🗑️</button>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
        </ng-container>
      </div>

      <div class="modal-backdrop" *ngIf="deleteDialog.visible" (click)="abortDelete()">
        <div class="modal-card modal-card-wide" (click)="$event.stopPropagation()">
          <h3>Dar de baja</h3>
          <p>Previsualización: marque o desmarque los items a dar de baja.</p>

          <div class="preview-toolbar">
            <label class="preview-check-all">
              <input
                type="checkbox"
                [checked]="deletePreviewAllSelected"
                [indeterminate]="deletePreviewSomeSelected && !deletePreviewAllSelected"
                (change)="toggleDeletePreviewAll($event)"
              />
              Seleccionar todos
            </label>
            <span class="selection-count">{{ deleteDialog.selectedIds.size }} de {{ deleteDialog.items.length }} seleccionado(s)</span>
          </div>

          <div class="preview-list">
            <label *ngFor="let item of deleteDialog.items" class="preview-row" [class.preview-row-off]="!deleteDialog.selectedIds.has(item.id)">
              <input
                type="checkbox"
                [checked]="deleteDialog.selectedIds.has(item.id)"
                (change)="toggleDeletePreviewItem(item.id)"
              />
              <span class="code-badge">{{ item.code }}</span>
              <span class="preview-meta">{{ item.platform_description }} ({{ item.platform_initial }}) · {{ item.object_description }} · {{ item.change_description }}</span>
              <span class="badge-sm">Time: {{ item.time }}</span>
            </label>
            <p *ngIf="!deleteDialog.items.length" class="muted">No hay items para mostrar</p>
          </div>

          <ul class="modal-help">
            <li><strong>Baja definitiva:</strong> borra de la base de datos</li>
            <li><strong>Baja lógica:</strong> marca el item sin borrarlo</li>
            <li><strong>Abortar:</strong> no realiza cambios</li>
          </ul>
          <div class="modal-actions">
            <button class="btn btn-danger" (click)="confirmDelete(true)" [disabled]="!deleteDialog.selectedIds.size">
              Baja definitiva ({{ deleteDialog.selectedIds.size }})
            </button>
            <button class="btn btn-warning" (click)="confirmDelete(false)" [disabled]="!deleteDialog.selectedIds.size">
              Baja lógica ({{ deleteDialog.selectedIds.size }})
            </button>
            <button class="btn btn-secondary" (click)="abortDelete()">Abortar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { width: 100%; }
    .select-platform { width: min(100%, 360px); max-width: 100%; }
    .items-table-wrap { margin-top: 4px; }
    .items-table-wrap .leaf-table { min-width: 520px; }
    .items-table-wrap .full-table { min-width: 980px; }
    .items-table-wrap .db-table { min-width: 920px; }
    .items-table-wrap .db-detail-table { min-width: 1480px; }
    .db-table th { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; text-transform: none; letter-spacing: 0; }
    .db-cell { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.84rem; color: var(--color-text-muted); }
    .fk-desc { margin-right: 6px; color: var(--color-text); }
    .view-hint code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.85em; background: var(--color-btn-secondary-bg); padding: 1px 6px; border-radius: 4px; color: var(--color-text);
    }
    .items-title-block { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
    .view-toggle {
      display: inline-flex; padding: 3px; gap: 2px;
      background: var(--color-btn-secondary-bg); border-radius: 8px; width: fit-content; flex-wrap: wrap;
    }
    .view-toggle-btn {
      border: none; background: transparent; cursor: pointer;
      padding: 6px 12px; border-radius: 6px; font-size: 0.8rem;
      font-weight: 600; color: var(--color-text-muted);
    }
    .view-toggle-btn.active {
      background: var(--color-surface); color: var(--color-text);
      box-shadow: var(--shadow-sm);
    }
    .view-hint { margin: 0 0 12px; }
    .actions-cell { white-space: nowrap; }
    .modal-backdrop {
      position: fixed; inset: 0; background: var(--color-backdrop);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal-card {
      background: var(--color-surface); border-radius: 10px; padding: 24px; width: min(440px, 92vw);
      box-shadow: var(--shadow-md); color: var(--color-text);
    }
    .modal-card-wide { width: min(620px, 94vw); }
    .modal-card h3 { margin: 0 0 10px; color: var(--color-text); }
    .modal-card p { margin: 0 0 12px; color: var(--color-text-muted); }
    .preview-toolbar {
      display: flex; justify-content: space-between; align-items: center;
      gap: 12px; margin-bottom: 8px; flex-wrap: wrap;
    }
    .preview-check-all {
      display: inline-flex; align-items: center; gap: 8px;
      font-size: 0.85rem; color: #334155; cursor: pointer;
    }
    .preview-list {
      border: 1px solid var(--color-border); border-radius: 8px; max-height: 260px;
      overflow-y: auto; margin-bottom: 14px; background: var(--color-surface-muted);
    }
    .preview-row {
      display: flex; align-items: center; gap: 10px; padding: 8px 12px;
      border-bottom: 1px solid var(--color-border); cursor: pointer; font-size: 0.85rem;
    }
    .preview-row:last-child { border-bottom: none; }
    .preview-row-off { opacity: 0.45; }
    .preview-meta { color: var(--color-text-muted); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .modal-help { margin: 0 0 20px; padding-left: 18px; color: var(--color-text-muted); font-size: 0.9rem; }
    .modal-help li { margin-bottom: 4px; }
    .modal-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
    .btn-warning { background: #f59e0b; color: #fff; }
    .btn-warning:hover:not(:disabled) { background: #d97706; }
    .header-row {
      display: flex; align-items: center; gap: 12px 16px; margin-bottom: clamp(14px, 2vw, 20px);
      flex-wrap: wrap;
    }
    h1 {
      margin: 0; color: var(--color-text);
      font-size: clamp(1.15rem, 1rem + 0.8vw, 1.5rem);
      line-height: 1.3; min-width: 0; flex: 1 1 220px;
    }
    h3 { margin: 0 0 16px; color: var(--color-text-muted); font-size: 1.1rem; }
    .items-header h3 { margin: 0; color: var(--color-text); }
    .items-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
    .items-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .selection-count { font-size: 0.85rem; color: var(--color-text-muted); }
    .btn-danger { background: var(--color-danger); color: #fff; }
    .btn-danger:hover:not(:disabled) { background: #b91c1c; }
    .btn-success { background: var(--color-success); color: #fff; }
    .btn-success:hover:not(:disabled) { background: #15803d; }
    .col-check { width: 36px; text-align: center; }
    .row-selected { background: color-mix(in srgb, var(--color-primary) 12%, transparent); }
    .row-baja { opacity: 0.65; background: var(--color-surface-muted); }
    .badge-baja { background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 600; }
    .badge-ok { background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 600; }
    .btn-icon:disabled { opacity: 0.35; cursor: not-allowed; }
    .activate-check {
      display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
      margin-right: 4px;
    }
    .activate-check input {
      width: 16px; height: 16px; cursor: pointer; accent-color: #16a34a;
    }
    .btn-activate {
      background: #16a34a; color: #fff; border: none; border-radius: 6px;
      padding: 4px 10px; font-size: 0.78rem; font-weight: 600; cursor: pointer;
    }
    .btn-activate:hover { background: #15803d; }
    .catalog-name { color: var(--color-primary); }
    .badge-cat { background: #fef3c7; color: #92400e; padding: 2px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; margin-left: 8px; }
    .card {
      background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 10px;
      padding: clamp(16px, 2vw, 24px); margin-bottom: 16px;
      box-shadow: var(--shadow-sm); width: 100%; min-width: 0;
    }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 14px; margin-top: 14px; }
    .multi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
      gap: clamp(12px, 1.5vw, 16px);
      margin-top: 14px;
    }
    .field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .field label { font-size: 0.8rem; color: var(--color-text-muted); font-weight: 500; text-transform: uppercase; }
    .hint { text-transform: none; font-weight: 400; color: var(--color-text-faint); }
    .select {
      padding: 8px 12px; border: 1px solid var(--color-border-strong); border-radius: 6px;
      font-size: 0.9rem; background: var(--color-surface); color: var(--color-text); width: 100%; max-width: 360px;
    }
    .select:focus { outline: none; border-color: var(--color-primary); box-shadow: var(--focus-ring); }
    .time-field { margin-top: 14px; max-width: 220px; }
    .input-time { width: 100%; }
    .edit-time-box { display: flex; flex-direction: column; gap: 12px; }
    .checkbox-box { border: 1px solid var(--color-border); border-radius: 6px; padding: 10px; max-height: 180px; overflow-y: auto; background: var(--color-surface-muted); }
    .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--color-text); padding: 4px 0; cursor: pointer; }
    .muted { font-size: 0.85rem; color: var(--color-text-faint); margin: 0; }
    .code-preview {
      margin-top: 16px; border-radius: 8px; border: 1px solid var(--color-border-strong);
      background: var(--color-surface-muted);
      overflow: hidden;
    }
    .code-preview.has-conflicts { border-color: #fca5a5; background: linear-gradient(180deg, #fff7f7 0%, #fef2f2 100%); }
    .preview-header {
      width: 100%; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
      padding: 12px 14px; border: none; background: transparent; cursor: pointer; text-align: left;
    }
    .preview-header:hover { background: rgba(15, 23, 42, 0.04); }
    .preview-chevron { color: #64748b; font-size: 0.7rem; width: 14px; }
    .preview-title { font-size: 0.85rem; font-weight: 700; color: var(--color-text); text-transform: uppercase; letter-spacing: 0.02em; }
    .preview-count {
      background: #0f172a; color: #38bdf8; font-size: 0.75rem; font-weight: 700;
      padding: 2px 8px; border-radius: 999px;
    }
    .preview-conflict-badge {
      background: #dc2626; color: #fff; font-size: 0.72rem; font-weight: 700;
      padding: 2px 8px; border-radius: 999px;
    }
    .preview-excluded-badge {
      background: #64748b; color: #fff; font-size: 0.72rem; font-weight: 700;
      padding: 2px 8px; border-radius: 999px;
    }
    .preview-toggle-hint { margin-left: auto; font-size: 0.75rem; color: #94a3b8; }
    .preview-body { padding: 0 14px 14px; }
    .preview-actions { display: flex; gap: 8px; margin-bottom: 10px; }
    .btn-sm { padding: 5px 12px; font-size: 0.8rem; }
    .code-tree { list-style: none; margin: 0; padding: 0; }
    .code-tree ul {
      list-style: none; margin: 0 0 4px;
      padding-left: clamp(10px, 2vw, 16px);
      border-left: 2px solid var(--color-border);
    }
    .code-tree li { margin: 2px 0; }
    .tree-node {
      width: 100%; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
      padding: 6px 8px; margin: 2px 0; border: 1px solid transparent; border-radius: 6px;
      background: var(--color-surface); cursor: pointer; text-align: left; color: var(--color-text);
    }
    .tree-node:hover { border-color: var(--color-border-strong); background: var(--color-surface-muted); }
    .tree-chevron { color: var(--color-text-muted); font-size: 0.65rem; width: 12px; flex-shrink: 0; }
    .tree-level-tag {
      font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;
      padding: 2px 6px; border-radius: 4px; flex-shrink: 0;
    }
    .level-platform .tree-level-tag { background: #dbeafe; color: #1d4ed8; }
    .level-object .tree-level-tag { background: #dcfce7; color: #15803d; }
    .level-change .tree-level-tag { background: #fef3c7; color: #b45309; }
    .level-complexity .tree-level-tag { background: #e0e7ff; color: #4338ca; }
    .tree-label { font-size: 0.88rem; font-weight: 600; color: var(--color-text); }
    .tree-meta { font-size: 0.72rem; color: var(--color-text-muted); margin-left: auto; }
    .tree-conflict-meta {
      font-size: 0.7rem; font-weight: 700; color: #b91c1c;
      background: #fee2e2; padding: 1px 6px; border-radius: 999px;
    }
    .tree-baja-meta {
      font-size: 0.7rem; font-weight: 700; color: #92400e;
      background: #fef3c7; padding: 1px 6px; border-radius: 999px;
    }
    .items-filters {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
      gap: 10px 12px;
      margin-bottom: 16px;
      padding: 12px;
      background: var(--color-surface-muted);
      border: 1px solid var(--color-border);
      border-radius: 8px;
    }
    .filter-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .filter-field label {
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.03em; color: var(--color-text-muted);
    }
    .filter-field .input,
    .filter-field .select { width: 100%; max-width: none; }
    .filter-actions { display: flex; align-items: flex-end; }
    .items-tree { list-style: none; margin: 0; padding: 0; }
    .items-tree > li { margin-bottom: 8px; }
    .items-tree ul { list-style: none; margin: 0 0 4px; padding-left: clamp(10px, 2vw, 16px); border-left: 2px solid var(--color-border); }
    .items-leaf {
      margin: 6px 0 12px clamp(8px, 2vw, 18px);
      padding: 10px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 8px;
    }
    .leaf-toolbar {
      display: flex; align-items: center; justify-content: space-between;
      gap: 10px; margin-bottom: 8px; flex-wrap: wrap;
    }
    .leaf-select-all {
      display: inline-flex; align-items: center; gap: 8px;
      font-size: 0.82rem; color: var(--color-text); cursor: pointer;
    }
    .leaf-table { min-width: 520px; }
    .code-list { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0 10px clamp(8px, 2vw, 20px); }
    .code-chip {
      display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
      font-family: monospace; font-size: 0.82rem; font-weight: 600;
      background: #0f172a; color: #38bdf8; padding: 4px 8px; border-radius: 5px;
      border: 1px solid transparent; user-select: none;
    }
    .code-chip input { width: 14px; height: 14px; cursor: pointer; accent-color: #38bdf8; margin: 0; }
    .code-chip.code-conflict {
      background: #fff1f2; color: #b91c1c; border-color: #fca5a5;
    }
    .code-chip.code-conflict input { accent-color: #dc2626; }
    .code-chip.code-excluded {
      background: #f1f5f9; color: #94a3b8; border-color: #cbd5e1;
      text-decoration: line-through;
    }
    .conflict-tag, .excluded-tag {
      font-style: normal; font-family: system-ui, sans-serif;
      font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
      padding: 1px 5px; border-radius: 3px;
    }
    .conflict-tag { background: #dc2626; color: #fff; }
    .excluded-tag { background: #64748b; color: #fff; }
    .code-value { font-family: monospace; font-size: 1.1rem; font-weight: 700; color: var(--color-text); }
    .code-warning {
      margin: 10px 0 0; padding: 8px 10px; border-radius: 6px;
      background: #fee2e2; color: #991b1b; font-size: 0.8rem; font-weight: 500;
    }
    .code-ok-hint {
      margin: 10px 0 0; padding: 8px 10px; border-radius: 6px;
      background: #dcfce7; color: #166534; font-size: 0.8rem; font-weight: 500;
    }
    .form-row { display: flex; gap: 10px; flex-wrap: wrap; }
    .btn { padding: 8px 18px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; font-weight: 500; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: var(--color-primary); color: #fff; } .btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); }
    .btn-secondary { background: var(--color-btn-secondary-bg); color: var(--color-btn-secondary-text); }
    .table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    .table th { text-align: left; padding: 10px 8px; border-bottom: 2px solid var(--color-border); color: var(--color-text-muted); font-size: 0.75rem; text-transform: uppercase; background: var(--color-surface-muted); }
    .table td { padding: 10px 8px; border-bottom: 1px solid var(--color-border); color: var(--color-text); }
    .code-badge { background: #0f172a; color: #38bdf8; padding: 3px 10px; border-radius: 4px; font-family: monospace; font-size: 0.85rem; font-weight: 600; }
    .badge-sm { background: var(--color-badge-bg); color: var(--color-badge-text); padding: 1px 6px; border-radius: 8px; font-size: 0.75rem; font-weight: 600; }
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 4px; color: inherit; }
    .empty { text-align: center; color: var(--color-text-faint); padding: 24px !important; }
    .error { color: #dc2626; margin: 8px 0 0; font-size: 0.85rem; }
    .success { color: #166534; margin: 8px 0 0; font-size: 0.85rem; }

    @media (max-width: 720px) {
      .preview-toggle-hint { display: none; }
      .items-actions { width: 100%; }
      .items-actions .btn { flex: 1 1 auto; }
      .modal-card-wide { width: min(96vw, 620px); }
      .modal-actions { justify-content: stretch; }
      .modal-actions .btn { flex: 1 1 100%; }
    }
  `]
})
export class CatalogItemsComponent implements OnInit {
  catalogId = 0;
  catalog: Catalog | null = null;
  items: CatalogItem[] = [];
  platforms: Platform[] = [];
  allObjects: ObjectMaster[] = [];
  filteredObjects: ObjectMaster[] = [];
  changes: Change[] = [];
  complexityObjects: ComplexityObject[] = [];
  complexityChanges: ComplexityChange[] = [];

  platformId = 0;
  timeValue: number = 0;
  selectedObjectIds = new Set<number>();
  selectedChangeIds = new Set<number>();
  selectedComplexityObjectIds = new Set<number>();
  selectedComplexityChangeIds = new Set<number>();

  editing: number | null = null;
  error = '';
  success = '';
  saving = false;
  deleting = false;
  activating = false;
  editCodePreview = '';
  selectedItemIds = new Set<number>();
  selectedActivateIds = new Set<number>();
  previewPanelCollapsed = false;
  collapsedTreeKeys = new Set<string>();
  excludedCodes = new Set<string>();
  itemsCollapsedKeys = new Set<string>();
  private itemsTreeInitialized = false;
  itemsViewMode: 'full' | 'summary' | 'db' | 'db_detail' = 'full';
  itemFilters: {
    code: string;
    platformId: number;
    objectId: number;
    changeId: number;
    complexityObjectId: number;
    complexityChangeId: number;
    baja: BajaFilter;
  } = {
    code: '',
    platformId: 0,
    objectId: 0,
    changeId: 0,
    complexityObjectId: 0,
    complexityChangeId: 0,
    baja: 'all',
  };

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.catalogId = Number(this.route.snapshot.paramMap.get('catalogId'));
    this.api.getCatalog(this.catalogId).subscribe(c => this.catalog = c);
    this.loadMasters();
    this.loadItems();
  }

  get hasSelection(): boolean {
    return this.selectedObjectIds.size > 0 || this.selectedChangeIds.size > 0
      || this.selectedComplexityObjectIds.size > 0 || this.selectedComplexityChangeIds.size > 0;
  }

  get showObjeto(): boolean {
    return this.platformId > 0;
  }

  get showCambio(): boolean {
    return this.showObjeto && this.selectedObjectIds.size > 0;
  }

  get showComplejidadObjeto(): boolean {
    return this.showCambio && this.selectedChangeIds.size > 0;
  }

  get showComplejidadCambio(): boolean {
    return this.showComplejidadObjeto && this.selectedComplexityObjectIds.size > 0;
  }

  get previewTree(): PreviewTreeNode | null {
    if (!this.platformId || !this.selectedObjectIds.size || !this.selectedChangeIds.size
      || !this.selectedComplexityObjectIds.size || !this.selectedComplexityChangeIds.size) {
      return null;
    }
    const platform = this.platforms.find(p => p.id === this.platformId);
    if (!platform) return null;

    const existingCodes = new Set(this.items.map(i => i.code));
    const seenCodes = new Set<string>();
    const objectNodes: PreviewTreeNode[] = [];

    for (const oid of this.selectedObjectIds) {
      const obj = this.allObjects.find(o => o.id === oid);
      if (!obj) continue;
      const changeNodes: PreviewTreeNode[] = [];

      for (const cid of this.selectedChangeIds) {
        const change = this.changes.find(c => c.id === cid);
        if (!change) continue;
        const coNodes: PreviewTreeNode[] = [];

        for (const coid of this.selectedComplexityObjectIds) {
          const co = this.complexityObjects.find(x => x.id === coid);
          if (!co) continue;
          const codes: PreviewCode[] = [];

          for (const ccid of this.selectedComplexityChangeIds) {
            const cc = this.complexityChanges.find(x => x.id === ccid);
            if (!cc) continue;
            const code = `${platform.initial}${obj.initial}${change.initial}${co.initial}${cc.initial}`;
            const exists = existingCodes.has(code) || seenCodes.has(code);
            seenCodes.add(code);
            codes.push({
              code,
              exists,
              objectId: obj.id,
              changeId: change.id,
              complexityObjectId: co.id,
              complexityChangeId: cc.id,
            });
          }

          const included = codes.filter(c => this.isCodeIncluded(c.code));
          coNodes.push({
            key: `p${platform.id}-o${obj.id}-c${change.id}-co${co.id}`,
            label: `${co.description} (${co.initial})`,
            level: 'complexity',
            codes,
            codeCount: included.length,
            conflictCount: included.filter(c => c.exists).length,
          });
        }

        changeNodes.push({
          key: `p${platform.id}-o${obj.id}-c${change.id}`,
          label: `${change.description} (${change.initial})`,
          level: 'change',
          children: coNodes,
          codeCount: coNodes.reduce((n, node) => n + node.codeCount, 0),
          conflictCount: coNodes.reduce((n, node) => n + node.conflictCount, 0),
        });
      }

      objectNodes.push({
        key: `p${platform.id}-o${obj.id}`,
        label: `${obj.description} (${obj.initial})`,
        level: 'object',
        children: changeNodes,
        codeCount: changeNodes.reduce((n, node) => n + node.codeCount, 0),
        conflictCount: changeNodes.reduce((n, node) => n + node.conflictCount, 0),
      });
    }

    return {
      key: `p${platform.id}`,
      label: `${platform.description} (${platform.initial})`,
      level: 'platform',
      children: objectNodes,
      codeCount: objectNodes.reduce((n, node) => n + node.codeCount, 0),
      conflictCount: objectNodes.reduce((n, node) => n + node.conflictCount, 0),
    };
  }

  get previewCodes(): PreviewCode[] {
    const tree = this.previewTree;
    if (!tree?.children) return [];
    const codes: PreviewCode[] = [];
    for (const obj of tree.children) {
      for (const change of obj.children || []) {
        for (const co of change.children || []) {
          if (co.codes) codes.push(...co.codes);
        }
      }
    }
    return codes;
  }

  get includedCodes(): PreviewCode[] {
    return this.previewCodes.filter(c => this.isCodeIncluded(c.code));
  }

  get existingCount(): number {
    return this.previewCodes.filter(c => c.exists).length;
  }

  get activeConflictCount(): number {
    return this.includedCodes.filter(c => c.exists).length;
  }

  isCodeIncluded(code: string): boolean {
    return !this.excludedCodes.has(code);
  }

  toggleCodeInclusion(code: string) {
    if (this.excludedCodes.has(code)) this.excludedCodes.delete(code);
    else this.excludedCodes.add(code);
    this.excludedCodes = new Set(this.excludedCodes);
  }

  excludeAllConflicts() {
    for (const c of this.previewCodes) {
      if (c.exists) this.excludedCodes.add(c.code);
    }
    this.excludedCodes = new Set(this.excludedCodes);
  }

  private pruneExcludedCodes() {
    const valid = new Set(this.previewCodes.map(c => c.code));
    this.excludedCodes = new Set([...this.excludedCodes].filter(code => valid.has(code)));
  }

  togglePreviewPanel() {
    this.previewPanelCollapsed = !this.previewPanelCollapsed;
  }

  isTreeCollapsed(key: string): boolean {
    return this.collapsedTreeKeys.has(key);
  }

  toggleTreeNode(key: string) {
    if (this.collapsedTreeKeys.has(key)) this.collapsedTreeKeys.delete(key);
    else this.collapsedTreeKeys.add(key);
    this.collapsedTreeKeys = new Set(this.collapsedTreeKeys);
  }

  loadMasters() {
    this.api.getPlatforms().subscribe(d => this.platforms = d);
    this.api.getObjects().subscribe(d => this.allObjects = d);
    this.api.getChanges().subscribe(d => this.changes = d);
    this.api.getComplexityObjects().subscribe(d => this.complexityObjects = d);
    this.api.getComplexityChanges().subscribe(d => this.complexityChanges = d);
  }

  loadItems() {
    this.api.getCatalogItems(this.catalogId).subscribe(d => {
      this.items = d;
      const activeIds = new Set(d.filter(i => !i.baja_logica).map(i => i.id));
      const bajaIds = new Set(d.filter(i => i.baja_logica).map(i => i.id));
      this.selectedItemIds = new Set([...this.selectedItemIds].filter(id => activeIds.has(id)));
      this.selectedActivateIds = new Set([...this.selectedActivateIds].filter(id => bajaIds.has(id)));
      if (!this.itemsTreeInitialized && d.length) {
        this.itemsTreeInitialized = true;
        this.collapseItemsBelowPlatform();
      }
    });
  }

  private collapseItemsBelowPlatform() {
    const keys = new Set<string>();
    for (const platform of this.itemsTree) {
      for (const obj of platform.children || []) {
        keys.add(obj.key);
        for (const change of obj.children || []) {
          keys.add(change.key);
          for (const co of change.children || []) keys.add(co.key);
        }
      }
    }
    this.itemsCollapsedKeys = keys;
  }

  get hasItemFilters(): boolean {
    return !!(
      this.itemFilters.code.trim()
      || this.itemFilters.platformId
      || this.itemFilters.objectId
      || this.itemFilters.changeId
      || this.itemFilters.complexityObjectId
      || this.itemFilters.complexityChangeId
      || this.itemFilters.baja !== 'all'
    );
  }

  get filteredItems(): CatalogItem[] {
    const q = this.itemFilters.code.trim().toLowerCase();
    return this.items.filter(i => {
      if (q && !i.code.toLowerCase().includes(q)) return false;
      if (this.itemFilters.platformId && i.platform_id !== this.itemFilters.platformId) return false;
      if (this.itemFilters.objectId && i.object_id !== this.itemFilters.objectId) return false;
      if (this.itemFilters.changeId && i.change_id !== this.itemFilters.changeId) return false;
      if (this.itemFilters.complexityObjectId && i.complexity_object_id !== this.itemFilters.complexityObjectId) return false;
      if (this.itemFilters.complexityChangeId && i.complexity_change_id !== this.itemFilters.complexityChangeId) return false;
      if (this.itemFilters.baja === 'yes' && !i.baja_logica) return false;
      if (this.itemFilters.baja === 'no' && i.baja_logica) return false;
      return true;
    });
  }

  get filterPlatformOptions(): { id: number; label: string }[] {
    return this.uniqueFilterOptions(this.items, i => i.platform_id, i => `${i.platform_description} (${i.platform_initial})`);
  }

  get filterObjectOptions(): { id: number; label: string }[] {
    const source = this.itemFilters.platformId
      ? this.items.filter(i => i.platform_id === this.itemFilters.platformId)
      : this.items;
    return this.uniqueFilterOptions(source, i => i.object_id, i => `${i.object_description} (${i.object_initial})`);
  }

  get filterChangeOptions(): { id: number; label: string }[] {
    return this.uniqueFilterOptions(this.items, i => i.change_id, i => `${i.change_description} (${i.change_initial})`);
  }

  get filterComplexityObjectOptions(): { id: number; label: string }[] {
    return this.uniqueFilterOptions(
      this.items,
      i => i.complexity_object_id,
      i => `${i.complexity_object_description} (${i.complexity_object_initial})`,
    );
  }

  get filterComplexityChangeOptions(): { id: number; label: string }[] {
    return this.uniqueFilterOptions(
      this.items,
      i => i.complexity_change_id,
      i => `${i.complexity_change_description} (${i.complexity_change_initial})`,
    );
  }

  get itemsTree(): ItemsTreeNode[] {
    const groups = new Map<number, Map<number, Map<number, Map<number, CatalogItem[]>>>>();

    for (const item of this.filteredItems) {
      if (!groups.has(item.platform_id)) groups.set(item.platform_id, new Map());
      const byObject = groups.get(item.platform_id)!;
      if (!byObject.has(item.object_id)) byObject.set(item.object_id, new Map());
      const byChange = byObject.get(item.object_id)!;
      if (!byChange.has(item.change_id)) byChange.set(item.change_id, new Map());
      const byCo = byChange.get(item.change_id)!;
      if (!byCo.has(item.complexity_object_id)) byCo.set(item.complexity_object_id, []);
      byCo.get(item.complexity_object_id)!.push(item);
    }

    const tree: ItemsTreeNode[] = [];
    for (const [platformId, byObject] of groups) {
      const objectNodes: ItemsTreeNode[] = [];
      for (const [objectId, byChange] of byObject) {
        const changeNodes: ItemsTreeNode[] = [];
        for (const [changeId, byCo] of byChange) {
          const coNodes: ItemsTreeNode[] = [];
          for (const [coId, leafItems] of byCo) {
            leafItems.sort((a, b) => a.code.localeCompare(b.code));
            const sample = leafItems[0];
            coNodes.push({
              key: `items-p${platformId}-o${objectId}-c${changeId}-co${coId}`,
              label: `${sample.complexity_object_description} (${sample.complexity_object_initial})`,
              level: 'complexity',
              itemCount: leafItems.length,
              bajaCount: leafItems.filter(i => i.baja_logica).length,
              items: leafItems,
            });
          }
          coNodes.sort((a, b) => a.label.localeCompare(b.label));
          const changeSample = byCo.values().next().value![0];
          changeNodes.push({
            key: `items-p${platformId}-o${objectId}-c${changeId}`,
            label: `${changeSample.change_description} (${changeSample.change_initial})`,
            level: 'change',
            itemCount: coNodes.reduce((n, node) => n + node.itemCount, 0),
            bajaCount: coNodes.reduce((n, node) => n + node.bajaCount, 0),
            children: coNodes,
          });
        }
        changeNodes.sort((a, b) => a.label.localeCompare(b.label));
        const objectSample = byChange.values().next().value!.values().next().value![0];
        objectNodes.push({
          key: `items-p${platformId}-o${objectId}`,
          label: `${objectSample.object_description} (${objectSample.object_initial})`,
          level: 'object',
          itemCount: changeNodes.reduce((n, node) => n + node.itemCount, 0),
          bajaCount: changeNodes.reduce((n, node) => n + node.bajaCount, 0),
          children: changeNodes,
        });
      }
      objectNodes.sort((a, b) => a.label.localeCompare(b.label));
      const platformSample = byObject.values().next().value!.values().next().value!.values().next().value![0];
      tree.push({
        key: `items-p${platformId}`,
        label: `${platformSample.platform_description} (${platformSample.platform_initial})`,
        level: 'platform',
        itemCount: objectNodes.reduce((n, node) => n + node.itemCount, 0),
        bajaCount: objectNodes.reduce((n, node) => n + node.bajaCount, 0),
        children: objectNodes,
      });
    }
    return tree.sort((a, b) => a.label.localeCompare(b.label));
  }

  private uniqueFilterOptions(
    source: CatalogItem[],
    idOf: (i: CatalogItem) => number,
    labelOf: (i: CatalogItem) => string,
  ): { id: number; label: string }[] {
    const map = new Map<number, string>();
    for (const item of source) map.set(idOf(item), labelOf(item));
    return [...map.entries()]
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  clearItemFilters() {
    this.itemFilters = {
      code: '',
      platformId: 0,
      objectId: 0,
      changeId: 0,
      complexityObjectId: 0,
      complexityChangeId: 0,
      baja: 'all',
    };
  }

  setItemsViewMode(mode: 'full' | 'summary' | 'db' | 'db_detail') {
    this.itemsViewMode = mode;
    if (mode === 'db' || mode === 'db_detail') {
      this.selectedItemIds = new Set();
      this.selectedActivateIds = new Set();
      if (this.editing) this.cancelEdit();
    }
    if (mode === 'summary' && !this.itemsTreeInitialized && this.items.length) {
      this.itemsTreeInitialized = true;
      this.collapseItemsBelowPlatform();
    }
  }

  get isDbReadOnlyView(): boolean {
    return this.itemsViewMode === 'db' || this.itemsViewMode === 'db_detail';
  }

  isItemsTreeCollapsed(key: string): boolean {
    return this.itemsCollapsedKeys.has(key);
  }

  toggleItemsTreeNode(key: string) {
    if (this.itemsCollapsedKeys.has(key)) this.itemsCollapsedKeys.delete(key);
    else this.itemsCollapsedKeys.add(key);
    this.itemsCollapsedKeys = new Set(this.itemsCollapsedKeys);
  }

  expandAllItemsTree() {
    this.itemsCollapsedKeys = new Set();
  }

  collapseAllItemsTree() {
    const keys = new Set<string>();
    const walk = (nodes: ItemsTreeNode[]) => {
      for (const node of nodes) {
        keys.add(node.key);
        if (node.children) walk(node.children);
      }
    };
    walk(this.itemsTree);
    this.itemsCollapsedKeys = keys;
  }

  groupActiveItems(items: CatalogItem[]): CatalogItem[] {
    return items.filter(i => !i.baja_logica);
  }

  isGroupAllSelected(items: CatalogItem[]): boolean {
    const active = this.groupActiveItems(items);
    return active.length > 0 && active.every(i => this.selectedItemIds.has(i.id));
  }

  isGroupSomeSelected(items: CatalogItem[]): boolean {
    return this.groupActiveItems(items).some(i => this.selectedItemIds.has(i.id));
  }

  toggleGroupSelect(event: Event, items: CatalogItem[]) {
    const checked = (event.target as HTMLInputElement).checked;
    const next = new Set(this.selectedItemIds);
    for (const item of this.groupActiveItems(items)) {
      if (checked) next.add(item.id);
      else next.delete(item.id);
    }
    this.selectedItemIds = next;
  }

  get activeItems(): CatalogItem[] {
    const source = this.itemsViewMode === 'summary' ? this.filteredItems : this.items;
    return source.filter(i => !i.baja_logica);
  }

  get allSelected(): boolean {
    return this.activeItems.length > 0 && this.activeItems.every(i => this.selectedItemIds.has(i.id));
  }

  get someSelected(): boolean {
    return this.selectedItemIds.size > 0;
  }

  toggleActivateSelect(id: number) {
    if (this.selectedActivateIds.has(id)) this.selectedActivateIds.delete(id);
    else this.selectedActivateIds.add(id);
    this.selectedActivateIds = new Set(this.selectedActivateIds);
  }

  activateSelection() {
    const ids = Array.from(this.selectedActivateIds);
    if (!ids.length) return;
    if (!confirm(`¿Activar ${ids.length} item(s) con baja lógica?`)) return;

    this.activating = true;
    this.error = '';
    this.api.bulkActivateCatalogItems(this.catalogId, ids).subscribe({
      next: (res) => {
        this.activating = false;
        this.selectedActivateIds = new Set();
        this.loadItems();
        this.success = `${res.activated} item(s) activados`;
      },
      error: (e) => {
        this.activating = false;
        this.error = e.error?.detail || 'Error al activar la selección';
      },
    });
  }

  toggleItem(id: number) {
    const item = this.items.find(i => i.id === id);
    if (!item || item.baja_logica) return;
    if (this.selectedItemIds.has(id)) this.selectedItemIds.delete(id);
    else this.selectedItemIds.add(id);
    this.selectedItemIds = new Set(this.selectedItemIds);
  }

  toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedItemIds = checked
      ? new Set(this.activeItems.map(i => i.id))
      : new Set();
  }

  deleteDialog: {
    visible: boolean;
    items: CatalogItem[];
    selectedIds: Set<number>;
  } = { visible: false, items: [], selectedIds: new Set() };

  get deletePreviewAllSelected(): boolean {
    return this.deleteDialog.items.length > 0
      && this.deleteDialog.selectedIds.size === this.deleteDialog.items.length;
  }

  get deletePreviewSomeSelected(): boolean {
    return this.deleteDialog.selectedIds.size > 0;
  }

  openDeleteDialog(itemIds: number[]) {
    if (!itemIds.length) return;
    const items = this.items.filter(i => itemIds.includes(i.id));
    if (!items.length) return;
    this.deleteDialog = {
      visible: true,
      items,
      selectedIds: new Set(items.map(i => i.id)),
    };
  }

  toggleDeletePreviewItem(id: number) {
    if (this.deleteDialog.selectedIds.has(id)) this.deleteDialog.selectedIds.delete(id);
    else this.deleteDialog.selectedIds.add(id);
    this.deleteDialog.selectedIds = new Set(this.deleteDialog.selectedIds);
  }

  toggleDeletePreviewAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.deleteDialog.selectedIds = checked
      ? new Set(this.deleteDialog.items.map(i => i.id))
      : new Set();
  }

  abortDelete() {
    this.deleteDialog = { visible: false, items: [], selectedIds: new Set() };
  }

  confirmDelete(definitiva: boolean) {
    const itemIds = Array.from(this.deleteDialog.selectedIds);
    this.abortDelete();
    if (!itemIds.length) return;

    this.deleting = true;
    this.error = '';
    this.success = '';

    const request$ = itemIds.length === 1
      ? this.api.deleteCatalogItem(this.catalogId, itemIds[0], definitiva)
      : this.api.bulkDeleteCatalogItems(this.catalogId, itemIds, definitiva);

    request$.subscribe({
      next: (res) => {
        this.deleting = false;
        this.selectedItemIds = new Set();
        this.loadItems();
        if (definitiva) {
          this.success = itemIds.length === 1
            ? `Item eliminado definitivamente`
            : `${res.deleted} item(s) eliminados definitivamente`;
        } else {
          this.success = itemIds.length === 1
            ? `Item dado de baja lógica`
            : `${res.updated ?? 1} item(s) dados de baja lógica`;
        }
      },
      error: (e) => {
        this.deleting = false;
        this.error = e.error?.detail || 'Error al dar de baja';
      },
    });
  }

  deleteSelection() {
    if (!this.selectedItemIds.size) return;
    this.openDeleteDialog(Array.from(this.selectedItemIds));
  }

  private toggle(set: Set<number>, id: number) {
    if (set.has(id)) set.delete(id);
    else set.add(id);
  }

  toggleObject(id: number) {
    this.toggle(this.selectedObjectIds, id);
    if (!this.selectedObjectIds.size) {
      this.selectedChangeIds.clear();
      this.selectedComplexityObjectIds.clear();
      this.selectedComplexityChangeIds.clear();
    }
    this.pruneExcludedCodes();
  }

  toggleChange(id: number) {
    this.toggle(this.selectedChangeIds, id);
    if (!this.selectedChangeIds.size) {
      this.selectedComplexityObjectIds.clear();
      this.selectedComplexityChangeIds.clear();
    }
    this.pruneExcludedCodes();
  }

  toggleComplexityObject(id: number) {
    this.toggle(this.selectedComplexityObjectIds, id);
    if (!this.selectedComplexityObjectIds.size) {
      this.selectedComplexityChangeIds.clear();
    }
    this.pruneExcludedCodes();
  }

  toggleComplexityChange(id: number) {
    this.toggle(this.selectedComplexityChangeIds, id);
    this.pruneExcludedCodes();
  }

  onPlatformChange() {
    if (this.platformId) {
      this.filteredObjects = this.allObjects.filter(o => o.platform_ids.includes(this.platformId));
    } else {
      this.filteredObjects = [];
    }
    this.selectedObjectIds.clear();
    this.selectedChangeIds.clear();
    this.selectedComplexityObjectIds.clear();
    this.selectedComplexityChangeIds.clear();
    this.excludedCodes = new Set();
  }

  clearSelection() {
    this.selectedObjectIds.clear();
    this.selectedChangeIds.clear();
    this.selectedComplexityObjectIds.clear();
    this.selectedComplexityChangeIds.clear();
    this.excludedCodes = new Set();
    this.timeValue = 0;
    this.error = '';
    this.success = '';
  }

  private parseTime(): number {
    const value = Number(this.timeValue);
    return Number.isFinite(value) ? value : 0;
  }

  isFormValid(): boolean {
    if (this.editing) {
      return this.editing > 0 && Number.isFinite(Number(this.timeValue));
    }
    return this.platformId > 0
      && this.includedCodes.length > 0
      && this.activeConflictCount === 0;
  }

  save() {
    this.error = '';
    this.success = '';

    if (this.editing) {
      this.api.updateCatalogItem(this.catalogId, this.editing, { time: this.parseTime() }).subscribe({
        next: () => { this.loadItems(); this.cancelEdit(); this.success = 'Time actualizado'; },
        error: (e) => this.error = e.error?.detail || 'Error al guardar',
      });
      return;
    }

    if (this.activeConflictCount > 0) {
      this.error = 'Hay códigos en conflicto seleccionados. Desmárquelos antes de dar de alta.';
      return;
    }

    const combos = this.buildCombos();
    if (!combos.length) {
      this.error = 'Seleccione al menos un código para dar de alta';
      return;
    }

    this.saving = true;
    from(combos).pipe(
      concatMap(payload => this.api.createCatalogItem(this.catalogId, payload)),
      toArray(),
    ).subscribe({
      next: (results) => {
        this.saving = false;
        this.loadItems();
        this.clearSelection();
        this.success = `${results.length} item(s) creados correctamente`;
      },
      error: (e) => {
        this.saving = false;
        this.error = e.error?.detail || 'Error al guardar. No se completó el alta por conflicto o error.';
        this.loadItems();
      },
    });
  }

  buildCombos(): any[] {
    return this.includedCodes
      .filter(c => !c.exists)
      .map(c => ({
        platform_id: this.platformId,
        object_id: c.objectId,
        change_id: c.changeId,
        complexity_object_id: c.complexityObjectId,
        complexity_change_id: c.complexityChangeId,
        time: this.parseTime(),
      }));
  }

  edit(item: CatalogItem) {
    if (item.baja_logica) {
      this.error = 'No se puede editar un item con baja lógica';
      return;
    }
    this.editing = item.id;
    this.editCodePreview = item.code;
    this.timeValue = item.time ?? 0;
    this.error = '';
    this.success = '';
  }

  activate(item: CatalogItem) {
    if (!item.baja_logica) return;
    if (!confirm(`¿Activar el item ${item.code}?`)) return;
    this.error = '';
    this.api.activateCatalogItem(this.catalogId, item.id).subscribe({
      next: () => {
        this.selectedActivateIds.delete(item.id);
        this.selectedActivateIds = new Set(this.selectedActivateIds);
        this.loadItems();
        this.success = `Item ${item.code} activado`;
      },
      error: (e) => this.error = e.error?.detail || 'Error al activar',
    });
  }

  cancelEdit() {
    this.editing = null;
    this.editCodePreview = '';
    this.timeValue = 0;
    this.error = '';
  }

  remove(item: CatalogItem) {
    this.openDeleteDialog([item.id]);
  }

  goBack() { this.router.navigate(['/catalogs']); }
}
