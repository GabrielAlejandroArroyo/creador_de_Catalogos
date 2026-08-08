import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ComplexityChange } from '../../../models/interfaces';

@Component({
  selector: 'app-complexity-changes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h1>Complejidad Cambio</h1>
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
                <td>{{ item.id }}</td><td>{{ item.description }}</td>
                <td><span class="badge">{{ item.initial }}</span></td>
                <td class="actions-cell">
                  <button (click)="edit(item)" class="btn-icon">✏️</button>
                  <button (click)="remove(item)" class="btn-icon">🗑️</button>
                </td>
              </tr>
              <tr *ngIf="items.length === 0"><td colspan="4" class="empty">Sin registros</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .actions-cell { white-space: nowrap; }
  `]
})
export class ComplexityChangesComponent implements OnInit {
  items: ComplexityChange[] = [];
  form: Partial<ComplexityChange> = { description: '', initial: '' };
  editing: number | null = null;
  error = '';

  constructor(private api: ApiService) {}
  ngOnInit() { this.load(); }
  load() { this.api.getComplexityChanges().subscribe(data => this.items = data); }
  save() {
    this.error = '';
    if (!this.form.description || !this.form.initial) { this.error = 'Todos los campos son requeridos'; return; }
    const obs = this.editing ? this.api.updateComplexityChange(this.editing, this.form) : this.api.createComplexityChange(this.form);
    obs.subscribe({ next: () => { this.load(); this.cancelEdit(); }, error: (e) => this.error = e.error?.detail || 'Error' });
  }
  edit(item: ComplexityChange) { this.editing = item.id; this.form = { description: item.description, initial: item.initial }; }
  cancelEdit() { this.editing = null; this.form = { description: '', initial: '' }; this.error = ''; }
  remove(item: ComplexityChange) {
    if (!confirm(`¿Eliminar "${item.description}"?`)) return;
    this.api.deleteComplexityChange(item.id).subscribe({ next: () => this.load(), error: (e) => this.error = e.error?.detail || 'Error al eliminar' });
  }
}
