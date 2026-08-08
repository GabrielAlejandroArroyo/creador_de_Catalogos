import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AiConnection, AiMode } from '../../models/interfaces';

@Component({
  selector: 'app-ai-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h1>Mantenimiento IA</h1>
      <p class="muted intro">
        Configurá una o varias conexiones. Si no ponés API key, el sistema usa el modelo open source gratis
        (Ollama + DeepSeek-R1 u otro instalado). Para cloud (OpenAI, etc.) la key es obligatoria.
      </p>

      <div class="card">
        <h2 class="card-title">Preset gratis</h2>
        <p class="muted preset-help">
          Activa Ollama local sin API key. Preferencia: DeepSeek-R1 (reasoning). Si no está instalado:
          <code>ollama pull deepseek-r1</code>
        </p>
        <button type="button" class="btn btn-primary" (click)="useFree()" [disabled]="saving">
          Usar modelo open source gratis
        </button>
      </div>

      <div class="card">
        <h2 class="card-title">{{ editing ? 'Editar conexión' : 'Nueva conexión' }}</h2>
        <div class="form-row">
          <input [(ngModel)]="form.name" placeholder="Nombre (ej. OpenAI prod)" class="input" />
          <input [(ngModel)]="form.base_url" placeholder="Base URL" class="input" />
        </div>
        <div class="form-row">
          <input
            [(ngModel)]="form.api_key"
            [placeholder]="editing ? 'API key (vacío = sin key / gratis)' : 'API key (opcional si es Ollama local)'"
            class="input"
            type="password"
            autocomplete="off" />
          <input [(ngModel)]="form.model_name" placeholder="Modelo (ej. deepseek-r1)" class="input" />
          <select [(ngModel)]="form.mode" class="select">
            <option value="foundational">Fundacional</option>
            <option value="foundational_rag">Fundacional + RAG</option>
          </select>
        </div>
        <div class="form-row actions-row">
          <label class="check-label" *ngIf="!editing">
            <input type="checkbox" [(ngModel)]="form.activate" /> Activar al guardar
          </label>
          <button type="button" (click)="save()" class="btn btn-primary" [disabled]="saving">
            {{ editing ? 'Actualizar' : 'Agregar' }}
          </button>
          <button type="button" *ngIf="editing" (click)="cancelEdit()" class="btn btn-secondary">Cancelar</button>
        </div>
        <p *ngIf="error" class="error">{{ error }}</p>
        <p *ngIf="success" class="success">{{ success }}</p>
      </div>

      <div class="card">
        <h2 class="card-title">Conexiones</h2>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Modelo</th>
                <th>Modo</th>
                <th>API key</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of items">
                <td>
                  <strong>{{ item.name }}</strong>
                  <div class="muted url">{{ item.base_url }}</div>
                </td>
                <td>{{ item.model_name }}</td>
                <td>
                  <span class="badge" [class.badge-rag]="item.mode === 'foundational_rag'">
                    {{ item.mode === 'foundational_rag' ? 'Fundacional + RAG' : 'Fundacional' }}
                  </span>
                </td>
                <td><code>{{ item.api_key_masked || '—' }}</code></td>
                <td>
                  <span *ngIf="item.is_active" class="badge badge-active">Activa</span>
                  <span *ngIf="!item.is_enabled" class="badge badge-off">Deshabilitada</span>
                  <span *ngIf="item.is_enabled && !item.is_active" class="muted">Habilitada</span>
                </td>
                <td class="actions-cell">
                  <button type="button" class="btn-icon" title="Activar" (click)="activate(item)" [disabled]="item.is_active || !item.is_enabled">✓</button>
                  <button type="button" class="btn-icon" title="Probar" (click)="test(item)">🔌</button>
                  <button type="button" class="btn-icon" title="Editar" (click)="edit(item)">✏️</button>
                  <button type="button" class="btn-icon" title="Eliminar" (click)="remove(item)">🗑️</button>
                </td>
              </tr>
              <tr *ngIf="items.length === 0">
                <td colspan="6" class="empty">
                  Todavía no hay conexiones. Cargá la primera API key arriba para usar el asistente.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p *ngIf="testMsg" [class.success]="testOk" [class.error]="!testOk">{{ testMsg }}</p>
      </div>
    </div>
  `,
  styles: [`
    .intro { margin: 0 0 1rem; max-width: 60rem; }
    .preset-help { margin: 0 0 0.75rem; max-width: 50rem; }
    .preset-help code { font-size: 0.85em; }
    .card-title { margin: 0 0 0.75rem; font-size: 1.05rem; }
    .actions-row { align-items: center; }
    .check-label { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.9rem; }
    .url { font-size: 0.8rem; word-break: break-all; }
    .actions-cell { white-space: nowrap; }
    .badge-active { background: #d1fae5; color: #065f46; }
    .badge-off { background: #fee2e2; color: #991b1b; }
    .badge-rag { background: #e0e7ff; color: #3730a3; }
    :host-context([data-theme="dark"]) .badge-active { background: #064e3b; color: #a7f3d0; }
    :host-context([data-theme="dark"]) .badge-off { background: #7f1d1d; color: #fecaca; }
    :host-context([data-theme="dark"]) .badge-rag { background: #312e81; color: #c7d2fe; }
    @media (max-width: 720px) {
      .form-row .input, .form-row .select, .form-row .btn { width: 100%; }
    }
  `],
})
export class AiSettingsComponent implements OnInit {
  items: AiConnection[] = [];
  form = this.emptyForm();
  editing: number | null = null;
  error = '';
  success = '';
  testMsg = '';
  testOk = false;
  saving = false;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
  }

  emptyForm() {
    return {
      name: '',
      base_url: 'http://127.0.0.1:11434/v1',
      api_key: '',
      model_name: 'deepseek-r1',
      mode: 'foundational_rag' as AiMode,
      activate: true,
    };
  }

  isLocalUrl(url: string): boolean {
    const u = (url || '').toLowerCase();
    return u.includes('127.0.0.1') || u.includes('localhost') || u.includes('ollama');
  }

  load() {
    this.api.getAiConnections().subscribe({
      next: (data) => (this.items = data),
      error: (e) => (this.error = e.error?.detail || 'No se pudieron cargar las conexiones'),
    });
  }

  useFree() {
    this.error = '';
    this.success = '';
    this.saving = true;
    this.api.useFreeOpensourceAi().subscribe({
      next: (conn) => {
        this.saving = false;
        this.success = `Activo: ${conn.name} · ${conn.model_name} (sin API key)`;
        this.load();
      },
      error: (e) => {
        this.saving = false;
        this.error = e.error?.detail || 'No se pudo activar el preset gratis';
      },
    });
  }

  save() {
    this.error = '';
    this.success = '';
    if (!this.form.name?.trim() || !this.form.model_name?.trim() || !this.form.base_url?.trim()) {
      this.error = 'Nombre, URL y modelo son requeridos';
      return;
    }
    if (!this.editing && !this.form.api_key?.trim() && !this.isLocalUrl(this.form.base_url)) {
      this.error = 'API key requerida para proveedores cloud. Sin key usá Ollama local o el preset gratis.';
      return;
    }

    this.saving = true;
    if (this.editing) {
      const payload: Record<string, unknown> = {
        name: this.form.name.trim(),
        base_url: this.form.base_url.trim(),
        model_name: this.form.model_name.trim(),
        mode: this.form.mode,
        api_key: this.form.api_key.trim(),
      };
      this.api.updateAiConnection(this.editing, payload).subscribe({
        next: () => {
          this.saving = false;
          this.success = 'Conexión actualizada';
          this.cancelEdit();
          this.load();
        },
        error: (e) => {
          this.saving = false;
          this.error = e.error?.detail || 'Error al actualizar';
        },
      });
      return;
    }

    this.api
      .createAiConnection({
        name: this.form.name.trim(),
        base_url: this.form.base_url.trim(),
        api_key: this.form.api_key.trim(),
        model_name: this.form.model_name.trim(),
        mode: this.form.mode,
        activate: this.form.activate,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.success = 'Conexión agregada';
          this.cancelEdit();
          this.load();
        },
        error: (e) => {
          this.saving = false;
          this.error = e.error?.detail || 'Error al guardar';
        },
      });
  }

  edit(item: AiConnection) {
    this.editing = item.id;
    this.form = {
      name: item.name,
      base_url: item.base_url,
      api_key: '',
      model_name: item.model_name,
      mode: item.mode,
      activate: false,
    };
    this.error = '';
    this.success = '';
  }

  cancelEdit() {
    this.editing = null;
    this.form = this.emptyForm();
    this.error = '';
  }

  activate(item: AiConnection) {
    this.error = '';
    this.api.activateAiConnection(item.id).subscribe({
      next: () => {
        this.success = `"${item.name}" quedó activa`;
        this.load();
      },
      error: (e) => (this.error = e.error?.detail || 'No se pudo activar'),
    });
  }

  test(item: AiConnection) {
    this.testMsg = 'Probando…';
    this.testOk = false;
    this.api.testAiConnection(item.id).subscribe({
      next: (res) => {
        this.testOk = res.ok;
        this.testMsg = res.detail;
      },
      error: (e) => {
        this.testOk = false;
        this.testMsg = e.error?.detail || 'Error al probar';
      },
    });
  }

  remove(item: AiConnection) {
    if (!confirm(`¿Eliminar la conexión "${item.name}"?`)) return;
    this.api.deleteAiConnection(item.id).subscribe({
      next: () => {
        this.success = 'Conexión eliminada';
        this.load();
      },
      error: (e) => (this.error = e.error?.detail || 'Error al eliminar'),
    });
  }
}
