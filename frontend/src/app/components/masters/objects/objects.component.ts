import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ObjectMaster, Platform } from '../../../models/interfaces';

@Component({
  selector: 'app-objects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h1>Objetos</h1>
      <div class="card">
        <div class="form-row">
          <input [(ngModel)]="form.description" placeholder="Descripción" class="input" />
          <input [(ngModel)]="form.initial" placeholder="Sigla" class="input input-sm" />
        </div>
        <div class="form-row" style="margin-top: 10px;">
          <label class="label">Plataformas asociadas:</label>
          <div class="checkbox-group">
            <label *ngFor="let p of platforms" class="checkbox-label">
              <input type="checkbox" [checked]="selectedPlatformIds.has(p.id)" (change)="togglePlatform(p.id)" />
              {{ p.description }} ({{ p.initial }})
            </label>
          </div>
        </div>
        <div class="form-row" style="margin-top: 10px;">
          <button (click)="save()" class="btn btn-primary">{{ editing ? 'Actualizar' : 'Agregar' }}</button>
          <button *ngIf="editing" (click)="cancelEdit()" class="btn btn-secondary">Cancelar</button>
        </div>
        <p *ngIf="error" class="error">{{ error }}</p>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr><th>ID</th><th>Descripción</th><th>Sigla</th><th>Plataformas</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of items">
                <td>{{ item.id }}</td>
                <td>{{ item.description }}</td>
                <td><span class="badge">{{ item.initial }}</span></td>
                <td>
                  <span *ngFor="let pid of item.platform_ids" class="badge badge-alt">{{ getPlatformDescription(pid) }}</span>
                </td>
                <td class="actions-cell">
                  <button (click)="edit(item)" class="btn-icon" title="Editar">✏️</button>
                  <button (click)="remove(item)" class="btn-icon" title="Eliminar">🗑️</button>
                </td>
              </tr>
              <tr *ngIf="items.length === 0"><td colspan="5" class="empty">Sin registros</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .label { font-size: 0.85rem; color: #475569; font-weight: 500; margin-right: 8px; }
    .checkbox-group { display: flex; gap: 12px; flex-wrap: wrap; }
    .checkbox-label { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #334155; cursor: pointer; }
    .badge { margin: 1px 2px; }
    .actions-cell { white-space: nowrap; }
  `]
})
export class ObjectsComponent implements OnInit {
  items: ObjectMaster[] = [];
  platforms: Platform[] = [];
  form: Partial<ObjectMaster> = { description: '', initial: '' };
  selectedPlatformIds = new Set<number>();
  editing: number | null = null;
  error = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getPlatforms().subscribe(data => this.platforms = data);
    this.load();
  }

  load() {
    this.api.getObjects().subscribe(data => this.items = data);
  }

  togglePlatform(id: number) {
    if (this.selectedPlatformIds.has(id)) this.selectedPlatformIds.delete(id);
    else this.selectedPlatformIds.add(id);
  }

  getPlatformDescription(id: number): string {
    const platform = this.platforms.find(p => p.id === id);
    if (!platform) return '?';
    return `${platform.description} (${platform.initial})`;
  }

  save() {
    this.error = '';
    if (!this.form.description || !this.form.initial) { this.error = 'Todos los campos son requeridos'; return; }
    if (this.selectedPlatformIds.size === 0) {
      this.error = 'Debe asociar al menos una plataforma (unicidad: sigla objeto + sigla plataforma)';
      return;
    }
    const payload = { ...this.form, platform_ids: Array.from(this.selectedPlatformIds) };
    const obs = this.editing
      ? this.api.updateObject(this.editing, payload)
      : this.api.createObject(payload);
    obs.subscribe({ next: () => { this.load(); this.cancelEdit(); }, error: (e) => this.error = e.error?.detail || 'Error' });
  }

  edit(item: ObjectMaster) {
    this.editing = item.id;
    this.form = { description: item.description, initial: item.initial };
    this.selectedPlatformIds = new Set(item.platform_ids);
  }

  cancelEdit() {
    this.editing = null;
    this.form = { description: '', initial: '' };
    this.selectedPlatformIds.clear();
    this.error = '';
  }

  remove(item: ObjectMaster) {
    if (!confirm(`¿Eliminar objeto "${item.description}"?`)) return;
    this.api.deleteObject(item.id).subscribe({ next: () => this.load(), error: (e) => this.error = e.error?.detail || 'Error al eliminar' });
  }
}
