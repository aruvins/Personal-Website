import { Routes } from '@angular/router';
export const routes: Routes = [
    {
      path: 'feature',
      loadChildren: () => import('./app.module').then(m => m.WebcamModule)
    }
  ];
