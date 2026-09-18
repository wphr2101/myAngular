import { Routes } from '@angular/router';
import { Comments } from './comments/comments';
import { Inputform } from './inputform/inputform';
import { Nations } from './nations/nations';
import { ObservableDemo } from './observable-demo/observable-demo';
import { Home } from './home/home';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'comments', component: Comments },
  { path: 'inputform', component: Inputform },
  { path: 'nations', component: Nations },
  { path: 'observable', component: ObservableDemo },
  { path: '**', redirectTo: '' },
];
