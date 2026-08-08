import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ThemeMode, ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-shell" [class.nav-open]="navOpen">
      <header class="topbar">
        <button
          type="button"
          class="menu-btn"
          (click)="toggleNav()"
          [attr.aria-expanded]="navOpen"
          [attr.aria-label]="navOpen ? 'Cerrar menú' : 'Abrir menú'">
          <span class="menu-icon" [class.open]="navOpen" aria-hidden="true"></span>
        </button>
        <div class="topbar-brand">
          <span class="brand-mark">C</span>
          <div class="brand-text">
            <strong>Creador de Catálogos</strong>
            <small>Maestros y items</small>
          </div>
        </div>
        <button
          type="button"
          class="theme-icon-btn"
          (click)="toggleTheme()"
          [attr.aria-label]="theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
          [title]="theme === 'dark' ? 'Modo claro' : 'Modo oscuro'">
          <svg *ngIf="theme === 'dark'" class="theme-svg" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4" fill="currentColor"/>
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
          </svg>
          <svg *ngIf="theme === 'light'" class="theme-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 14.3A8.5 8.5 0 0 1 9.7 3 7 7 0 1 0 21 14.3z" fill="currentColor"/>
          </svg>
        </button>
      </header>

      <div class="nav-backdrop" *ngIf="navOpen" (click)="closeNav()" aria-hidden="true"></div>

      <nav class="sidebar" aria-label="Navegación principal" [attr.aria-hidden]="isMobile && !navOpen">
        <div class="sidebar-header">
          <div class="brand-text desktop-only">
            <strong>Catálogos</strong>
            <small>Panel de gestión</small>
          </div>
          <button type="button" class="close-nav mobile-only" (click)="closeNav()" aria-label="Cerrar menú">✕</button>
        </div>
        <ul class="nav-list">
          <li class="nav-section">Maestros</li>
          <li><a routerLink="/platforms" routerLinkActive="active" (click)="closeNav()">Plataformas</a></li>
          <li><a routerLink="/objects" routerLinkActive="active" (click)="closeNav()">Objetos</a></li>
          <li><a routerLink="/changes" routerLinkActive="active" (click)="closeNav()">Cambios</a></li>
          <li><a routerLink="/complexity-objects" routerLinkActive="active" (click)="closeNav()">Complejidad Objeto</a></li>
          <li><a routerLink="/complexity-changes" routerLinkActive="active" (click)="closeNav()">Complejidad Cambio</a></li>
          <li class="nav-section">Gestión</li>
          <li><a routerLink="/catalogs" routerLinkActive="active" (click)="closeNav()">Catálogos</a></li>
        </ul>
      </nav>

      <main class="main-content">
        <div class="main-topbar desktop-only">
          <button
            type="button"
            class="theme-icon-btn theme-icon-btn-main"
            (click)="toggleTheme()"
            [attr.aria-label]="theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
            [title]="theme === 'dark' ? 'Modo claro' : 'Modo oscuro'">
            <svg *ngIf="theme === 'dark'" class="theme-svg" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4" fill="currentColor"/>
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
            </svg>
            <svg *ngIf="theme === 'light'" class="theme-svg" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 14.3A8.5 8.5 0 0 1 9.7 3 7 7 0 1 0 21 14.3z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        <div class="main-inner">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .app-shell {
      display: grid;
      grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
      grid-template-rows: 1fr;
      min-height: 100vh;
      min-height: 100dvh;
      width: 100%;
      background: var(--color-bg);
    }

    .topbar {
      display: none;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: var(--color-sidebar);
      color: #fff;
      position: sticky;
      top: 0;
      z-index: 40;
      border-bottom: 1px solid var(--color-sidebar-border);
    }

    .topbar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      flex: 1;
    }

    .brand-mark {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: var(--color-accent);
      color: #fff;
      display: grid;
      place-items: center;
      font-weight: 800;
      flex-shrink: 0;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
      line-height: 1.2;
    }

    .brand-text strong {
      font-size: 0.95rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #fff;
    }

    .brand-text small {
      font-size: 0.72rem;
      color: var(--color-sidebar-text);
    }

    .menu-btn,
    .close-nav {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 8px;
      background: var(--color-sidebar-hover);
      color: #fff;
      cursor: pointer;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }

    .menu-icon,
    .menu-icon::before,
    .menu-icon::after {
      display: block;
      width: 18px;
      height: 2px;
      background: #e2e8f0;
      border-radius: 2px;
      position: relative;
      transition: transform 0.2s, opacity 0.2s;
    }

    .menu-icon::before,
    .menu-icon::after {
      content: '';
      position: absolute;
      left: 0;
    }

    .menu-icon::before { top: -6px; }
    .menu-icon::after { top: 6px; }

    .menu-icon.open { background: transparent; }
    .menu-icon.open::before { top: 0; transform: rotate(45deg); }
    .menu-icon.open::after { top: 0; transform: rotate(-45deg); }

    .sidebar {
      background: var(--color-sidebar);
      color: var(--color-sidebar-text);
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      min-height: 100dvh;
      position: sticky;
      top: 0;
      align-self: start;
      z-index: 50;
      border-right: 1px solid var(--color-sidebar-border);
      width: 100%;
    }

    .sidebar-header {
      padding: 22px 18px 16px;
      border-bottom: 1px solid var(--color-sidebar-border);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }

    .sidebar-header .brand-text strong {
      color: #fff;
      font-size: 1.15rem;
    }

    .close-nav { width: 34px; height: 34px; }

    .nav-list {
      list-style: none;
      margin: 0;
      padding: 10px 0 24px;
      overflow-y: auto;
      flex: 1;
    }

    .nav-section {
      padding: 18px 18px 6px;
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #64748b;
      font-weight: 700;
    }

    .nav-list a {
      display: block;
      padding: 11px 18px;
      color: var(--color-sidebar-text);
      text-decoration: none;
      font-size: 0.92rem;
      border-left: 3px solid transparent;
      transition: background 0.15s, color 0.15s;
    }

    .nav-list a:hover {
      background: var(--color-sidebar-hover);
      color: #fff;
    }

    .nav-list a.active {
      background: var(--color-sidebar-hover);
      color: var(--color-sidebar-active);
      border-left-color: var(--color-sidebar-active);
      font-weight: 600;
    }

    .theme-icon-btn {
      width: 40px;
      height: 40px;
      border: 1px solid var(--color-sidebar-border);
      border-radius: 10px;
      background: var(--color-sidebar-hover);
      color: #e2e8f0;
      cursor: pointer;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }

    .theme-icon-btn:hover {
      color: #38bdf8;
      border-color: #38bdf8;
    }

    .theme-icon-btn-main {
      background: var(--color-surface);
      border-color: var(--color-border-strong);
      color: var(--color-text);
      box-shadow: var(--shadow-sm);
    }

    .theme-icon-btn-main:hover {
      color: var(--color-primary);
      border-color: var(--color-primary);
      background: var(--color-surface-muted);
    }

    .theme-svg {
      width: 20px;
      height: 20px;
      display: block;
    }

    .main-topbar {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding: 10px var(--space-page) 0;
      width: 100%;
      box-sizing: border-box;
    }

    .main-content {
      min-width: 0;
      width: 100%;
      min-height: 100vh;
      min-height: 100dvh;
      overflow: auto;
      background:
        radial-gradient(1200px 400px at 100% 0%, var(--color-bg-accent), transparent 60%),
        var(--color-bg);
      display: flex;
      flex-direction: column;
    }

    .main-inner {
      width: 100%;
      max-width: none;
      margin: 0;
      padding: var(--space-page);
      padding-top: clamp(8px, 1.2vw, 16px);
      min-height: 0;
      flex: 1;
      box-sizing: border-box;
    }

    .nav-backdrop { display: none; }
    .mobile-only { display: none; }
    .desktop-only { display: flex; }

    @media (max-width: 960px) {
      .app-shell {
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: auto minmax(0, 1fr);
      }

      .topbar {
        display: flex;
        grid-column: 1;
        grid-row: 1;
      }

      .sidebar {
        position: fixed;
        inset: 0 auto 0 0;
        width: min(86vw, 300px);
        max-width: 100%;
        transform: translateX(-105%);
        transition: transform 0.22s ease;
        box-shadow: var(--shadow-md);
      }

      .app-shell.nav-open .sidebar {
        transform: translateX(0);
      }

      .nav-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: var(--color-backdrop);
        z-index: 45;
      }

      .main-content {
        grid-column: 1;
        grid-row: 2;
        min-height: calc(100vh - 56px);
        min-height: calc(100dvh - 56px);
        width: 100%;
      }

      .main-inner {
        padding: clamp(12px, 3vw, 20px);
      }

      .main-topbar { display: none; }
      .mobile-only { display: inline-flex; align-items: center; justify-content: center; }
      .desktop-only { display: none; }
    }
  `]
})
export class LayoutComponent implements OnInit, OnDestroy {
  navOpen = false;
  theme: ThemeMode = 'light';
  isMobile = false;
  private themeSub?: Subscription;

  constructor(
    private router: Router,
    private themeService: ThemeService,
  ) {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.closeNav());
  }

  ngOnInit() {
    this.theme = this.themeService.theme;
    this.themeSub = this.themeService.theme$.subscribe(mode => this.theme = mode);
    this.updateIsMobile();
  }

  ngOnDestroy() {
    this.themeSub?.unsubscribe();
    document.body.classList.remove('nav-locked');
  }

  setTheme(mode: ThemeMode) {
    this.themeService.setTheme(mode);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleNav() {
    this.navOpen = !this.navOpen;
    this.syncBodyLock();
  }

  closeNav() {
    if (!this.navOpen) return;
    this.navOpen = false;
    this.syncBodyLock();
  }

  @HostListener('window:keydown.escape')
  onEscape() {
    this.closeNav();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateIsMobile();
    if (!this.isMobile) this.closeNav();
  }

  private updateIsMobile() {
    this.isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 960px)').matches;
  }

  private syncBodyLock() {
    document.body.classList.toggle('nav-locked', this.navOpen);
  }
}
