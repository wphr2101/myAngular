import { Routes } from '@angular/router';
import { Comments } from './comments/comments';
import { Inputform } from './inputform/inputform';
import { Nations } from './nations/nations';

export const routes: Routes = [
  { path: '', redirectTo: 'nations', pathMatch: 'full' },
  { path: 'comments', component: Comments },
  { path: 'inputform', component: Inputform },
  { path: 'nations', component: Nations },
];
