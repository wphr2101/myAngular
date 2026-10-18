import { Routes } from '@angular/router';
import { Comments } from './comments/comments';
import { Inputform } from './inputform/inputform';
import { Nations } from './nations/nations';
import { ObservableDemo } from './observable-demo/observable-demo';
import { Home } from './home/home';
import { Products } from './products/products';
import { Customer } from './shopping/customer';
import { Cart } from './shopping/cart';
import { Account } from './account/account';
import { Orders } from './shopping/orders';
import { Admin } from './admin/admin';
import { adminGuard } from './admin/admin.guard';
import { Logistics } from './logistics/logistics';

export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full' },
  { path: 'comments', component: Comments },
  { path: 'inputform', component: Inputform },
  { path: 'nations', component: Nations },
  { path: 'observable', component: ObservableDemo },
  {
    path: '', component: Logistics, data: { area: 'logistics' }, children: [
      { path: 'logistics', pathMatch: 'full', redirectTo: 'products' },
      { path: 'products', component: Products },
      { path: 'customer', component: Customer },
      { path: 'cart', component: Cart },
      { path: 'account', component: Account },
      { path: 'orders', component: Orders },
      { path: 'orders/:id', component: Orders },
      { path: 'admin', component: Admin, canActivate: [adminGuard], canDeactivate: [(component: Admin) => component.canLeave()] },
    ],
  },
  { path: '**', redirectTo: '' },
];
