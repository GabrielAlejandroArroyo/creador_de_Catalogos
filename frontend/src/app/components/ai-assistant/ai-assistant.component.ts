import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AiStatus } from '../../models/interfaces';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <button
      type="button"
      class="ai-fab"
      (click)="toggle()"
      [attr.aria-expanded]="open"
      aria-label="Abrir asistente IA"
      title="Asistente IA">
      IA
    </button>

    <div class="ai-panel" *ngIf="open" role="dialog" aria-label="Asistente IA">
      <header class="ai-header">
        <div>
          <strong>Asistente IA</strong>
          <small class="muted">
            {{ status?.active_connection_name || 'IA' }} · {{ status?.model_name || '…' }}
            <span *ngIf="status?.mode === 'foundational_rag'"> · RAG</span>
          </small>
        </div>
        <button type="button" class="ai-close" (click)="close()" aria-label="Cerrar">✕</button>
      </header>

      <div class="ai-banner" *ngIf="status?.using_free_opensource">
        <span *ngIf="status?.provider_kind === 'ollama_free'">
          Sin API key: usando modelo open source gratis (Ollama).
        </span>
        <span *ngIf="status?.provider_kind === 'rag_offline'">
          Sin API key ni Ollama: ayuda local (RAG). Opcional: instalá Ollama + DeepSeek-R1.
        </span>
        <span *ngIf="status?.provider_kind === 'custom' && status?.using_free_opensource">
          Conexión local/gratis activa.
        </span>
        <button type="button" class="linkish" (click)="goToSettings()">Configurar otra IA</button>
      </div>

      <div class="ai-chips">
        <button
          type="button"
          class="chip"
          *ngFor="let c of concepts"
          (click)="askConcept(c)"
          [class.active]="selectedConcept === c">
          {{ c }}
        </button>
      </div>

      <div class="ai-messages">
        <div *ngFor="let m of messages" class="msg" [class.user]="m.role === 'user'" [class.assistant]="m.role === 'assistant'">
          {{ m.text }}
        </div>
        <div *ngIf="loading" class="msg assistant muted">Pensando…</div>
      </div>

      <form class="ai-input" (ngSubmit)="send()">
        <input
          class="input"
          [(ngModel)]="draft"
          name="aiDraft"
          placeholder="Preguntá sobre un concepto…"
          [disabled]="loading"
          autocomplete="off" />
        <button type="submit" class="btn btn-primary" [disabled]="loading || !draft.trim()">Enviar</button>
      </form>
      <p *ngIf="error" class="error ai-error">{{ error }}</p>
    </div>
  `,
  styles: [`
    .ai-fab {
      position: fixed;
      right: 1.1rem;
      bottom: 1.1rem;
      z-index: 60;
      width: 3.25rem;
      height: 3.25rem;
      border-radius: 999px;
      border: none;
      background: var(--color-accent);
      color: #fff;
      font-weight: 800;
      letter-spacing: 0.02em;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
    }
    .ai-fab:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 3px;
    }
    .ai-panel {
      position: fixed;
      right: 1rem;
      bottom: 4.6rem;
      z-index: 61;
      width: min(100% - 1.5rem, 380px);
      max-height: min(70vh, 560px);
      display: flex;
      flex-direction: column;
      background: var(--color-card, var(--color-bg));
      color: var(--color-text);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }
    .ai-header {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      align-items: flex-start;
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-sidebar);
      color: #fff;
    }
    .ai-header strong { display: block; }
    .ai-header small { display: block; margin-top: 0.2rem; opacity: 0.85; font-size: 0.75rem; }
    .ai-close {
      border: none;
      background: transparent;
      color: #fff;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      padding: 0.2rem;
    }
    .ai-banner {
      padding: 0.55rem 0.75rem;
      font-size: 0.78rem;
      line-height: 1.35;
      border-bottom: 1px solid var(--color-border);
      background: color-mix(in srgb, var(--color-accent) 12%, transparent);
      display: grid;
      gap: 0.35rem;
    }
    .linkish {
      border: none;
      background: none;
      color: var(--color-accent);
      cursor: pointer;
      text-align: left;
      padding: 0;
      font-size: 0.78rem;
      text-decoration: underline;
    }
    .ai-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      padding: 0.65rem 0.75rem 0;
    }
    .chip {
      border: 1px solid var(--color-border);
      background: transparent;
      color: var(--color-text);
      border-radius: 999px;
      padding: 0.25rem 0.65rem;
      font-size: 0.75rem;
      cursor: pointer;
    }
    .chip.active, .chip:hover {
      border-color: var(--color-accent);
      color: var(--color-accent);
    }
    .ai-messages {
      flex: 1;
      overflow: auto;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-height: 180px;
    }
    .msg {
      max-width: 92%;
      padding: 0.55rem 0.7rem;
      border-radius: 10px;
      font-size: 0.88rem;
      line-height: 1.4;
      white-space: pre-wrap;
    }
    .msg.user {
      align-self: flex-end;
      background: var(--color-accent);
      color: #fff;
    }
    .msg.assistant {
      align-self: flex-start;
      background: var(--color-border);
      color: var(--color-text);
    }
    .ai-input {
      display: flex;
      gap: 0.4rem;
      padding: 0.65rem 0.75rem 0.85rem;
      border-top: 1px solid var(--color-border);
    }
    .ai-input .input { flex: 1; min-width: 0; }
    .ai-error { margin: 0 0.75rem 0.75rem; font-size: 0.85rem; }
    @media (max-width: 720px) {
      .ai-panel {
        right: 0.5rem;
        left: 0.5rem;
        width: auto;
        bottom: 4.4rem;
      }
      .ai-fab { right: 0.85rem; bottom: 0.85rem; }
    }
  `],
})
export class AiAssistantComponent implements OnInit {
  open = false;
  status: AiStatus | null = null;
  draft = '';
  loading = false;
  error = '';
  selectedConcept: string | null = null;
  messages: ChatMessage[] = [];

  concepts = [
    'Plataforma',
    'Objeto',
    'Cambio',
    'Complejidad',
    'Catálogo',
    'Código',
    'Time',
    'Baja',
    'Exportación',
  ];

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.refreshStatus();
  }

  refreshStatus() {
    this.api.getAiStatus().subscribe({
      next: (s) => (this.status = s),
      error: () =>
        (this.status = {
          configured: true,
          connections_count: 0,
          using_free_opensource: true,
          provider_kind: 'rag_offline',
          active_connection_name: 'Ayuda local',
          model_name: 'rag-offline',
        }),
    });
  }

  toggle() {
    this.open = !this.open;
    if (this.open) {
      this.error = '';
      this.refreshStatus();
    }
  }

  close() {
    this.open = false;
  }

  goToSettings() {
    this.open = false;
    this.router.navigate(['/ai-settings']);
  }

  askConcept(concept: string) {
    this.selectedConcept = concept;
    this.draft = `¿Qué es ${concept} en esta app y cómo se usa?`;
  }

  send() {
    const message = this.draft.trim();
    if (!message || this.loading) return;

    this.error = '';
    this.messages.push({ role: 'user', text: message });
    this.draft = '';
    this.loading = true;

    this.api.aiChat({ message, concept: this.selectedConcept }).subscribe({
      next: (res) => {
        this.loading = false;
        this.messages.push({ role: 'assistant', text: res.reply });
        if (this.status) {
          this.status = {
            ...this.status,
            configured: true,
            active_connection_name: res.connection_name,
            model_name: res.model_name,
            mode: res.mode,
            provider_kind: res.provider_kind || this.status.provider_kind,
            using_free_opensource: res.provider_kind !== 'custom',
          };
        }
      },
      error: (e) => {
        this.loading = false;
        const detail = e.error?.detail || 'No se pudo obtener respuesta';
        this.error = detail;
        this.messages.push({ role: 'assistant', text: `Error: ${detail}` });
      },
    });
  }
}
