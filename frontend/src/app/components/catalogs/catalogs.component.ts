import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Catalog } from '../../models/interfaces';

@Component({
  selector: 'app-catalogs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h1>Catálogos</h1>
      <div class="card">
        <div class="form-row">
          <input [(ngModel)]="form.description" placeholder="Descripción" class="input" />
          <input [(ngModel)]="form.initial" placeholder="Sigla" class="input input-sm" />
          <button (click)="save()" class="btn btn-primary">{{ editing ? 'Actualizar' : 'Agregar' }}</button>
          <button *ngIf="editing" (click)="cancelEdit()" class="btn btn-secondary">Cancelar</button>
        </div>
        <p *ngIf="error" class="error">{{ error }}</p>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>ID</th><th>Descripción</th><th>Sigla</th><th>Acciones</th></tr></thead>
            <tbody>
              <tr *ngFor="let item of items">
                <td>{{ item.id }}</td>
                <td>
                  <a (click)="openCatalog(item)" class="link">{{ item.description }}</a>
                </td>
                <td><span class="badge badge-catalog">{{ item.initial }}</span></td>
                <td class="actions-cell">
                  <button (click)="openCatalog(item)" class="btn-icon" title="Ver Items">📋</button>
                  <button (click)="edit(item)" class="btn-icon" title="Editar">✏️</button>
                  <button (click)="remove(item)" class="btn-icon" title="Eliminar">🗑️</button>
                </td>
              </tr>
              <tr *ngIf="items.length === 0"><td colspan="4" class="empty">Sin catálogos</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .badge-catalog { background: #fef3c7; color: #92400e; }
    :host-context([data-theme="dark"]) .badge-catalog { background: #78350f; color: #fde68a; }
    .actions-cell { white-space: nowrap; }
  `]
})
export class CatalogsComponent implements OnInit {
  items: Catalog[] = [];
  form: Partial<Catalog> = { description: '', initial: '' };
  editing: number | null = null;
  error = '';

  constructor(private api: ApiService, private router: Router) {}
  ngOnInit() { this.load(); }
  load() { this.api.getCatalogs().subscribe(data => this.items = data); }

  openCatalog(catalog: Catalog) {
    this.router.navigate(['/catalogs', catalog.id, 'items']);
  }

  save() {
    this.error = '';
    if (!this.form.description || !this.form.initial) { this.error = 'Todos los campos son requeridos'; return; }
    const obs = this.editing ? this.api.updateCatalog(this.editing, this.form) : this.api.createCatalog(this.form);
    obs.subscribe({ next: () => { this.load(); this.cancelEdit(); }, error: (e) => this.error = e.error?.detail || 'Error' });
  }
  edit(item: Catalog) { this.editing = item.id; this.form = { description: item.description, initial: item.initial }; }
  cancelEdit() { this.editing = null; this.form = { description: '', initial: '' }; this.error = ''; }
  remove(item: Catalog) {
    if (!confirm(`¿Eliminar catálogo "${item.description}"?`)) return;
    this.api.deleteCatalog(item.id).subscribe({ next: () => this.load(), error: (e) => this.error = e.error?.detail || 'Error al eliminar' });
  }
}
