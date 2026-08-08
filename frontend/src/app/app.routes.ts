import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { PlatformsComponent } from './components/masters/platforms/platforms.component';
import { ObjectsComponent } from './components/masters/objects/objects.component';
import { ChangesComponent } from './components/masters/changes/changes.component';
import { ComplexityObjectsComponent } from './components/masters/complexity-objects/complexity-objects.component';
import { ComplexityChangesComponent } from './components/masters/complexity-changes/complexity-changes.component';
import { CatalogsComponent } from './components/catalogs/catalogs.component';
import { CatalogItemsComponent } from './components/catalog-items/catalog-items.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'catalogs', pathMatch: 'full' },
      { path: 'platforms', component: PlatformsComponent },
      { path: 'objects', component: ObjectsComponent },
      { path: 'changes', component: ChangesComponent },
      { path: 'complexity-objects', component: ComplexityObjectsComponent },
      { path: 'complexity-changes', component: ComplexityChangesComponent },
      { path: 'catalogs', component: CatalogsComponent },
      { path: 'catalogs/:catalogId/items', component: CatalogItemsComponent },
    ],
  },
];
