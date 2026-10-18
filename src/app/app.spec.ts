import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Component } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { App } from './app';
import { AuthService } from './account/auth-service';
import { Logistics } from './logistics/logistics';
import { CartStore } from './shopping/cart-store';

@Component({template: ''})
class EmptyPage {}

describe('App', () => {
  const refresh = vi.fn(() => of(null));
  const user = signal<any>(null);
  beforeEach(async () => {
    refresh.mockClear();
    user.set(null);
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([
        {path:'',component:EmptyPage,pathMatch:'full'},
        {path:'comments',component:EmptyPage},
        {path:'',component:Logistics,data:{area:'logistics'},children:[
          {path:'logistics',redirectTo:'products',pathMatch:'full'},
          {path:'products',component:EmptyPage},{path:'cart',component:EmptyPage},
          {path:'orders/:id',component:EmptyPage},{path:'account',component:EmptyPage},
        ]},
      ]), { provide: AuthService, useValue: { refresh, user } }],
    }).compileComponents();
  });
  it('creates the app', () => {
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });
  it('shows one Logistics entry and hides shopping navigation on the overview', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.brand strong')?.textContent).toContain('Customer Operations');
    expect(element.querySelector('a[href="/logistics"]')?.textContent).toContain('Logistics');
    expect(element.querySelector('a[href="/account"]')).toBeNull();
    expect(element.querySelector('nav[aria-label="Logistics navigation"]')).toBeNull();
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it('opens the Logistics workspace and removes its links after leaving', async () => {
    const fixture=TestBed.createComponent(App);fixture.detectChanges();
    const router=TestBed.inject(Router);
    await router.navigateByUrl('/logistics');fixture.detectChanges();
    expect(router.url).toBe('/products');
    const element=fixture.nativeElement as HTMLElement;
    expect(element.querySelector('nav[aria-label="Logistics navigation"] a[href="/account"]')).toBeTruthy();
    expect(element.querySelector('.primary-nav a[href="/products"]')).toBeNull();
    expect(element.querySelector('.primary-nav a[href="/logistics"]')?.classList.contains('active')).toBe(true);
    await router.navigateByUrl('/comments');fixture.detectChanges();
    expect(element.querySelector('nav[aria-label="Logistics navigation"]')).toBeNull();
  });
  it('keeps direct order links in the Logistics workspace and updates cart and role links', async () => {
    const fixture=TestBed.createComponent(App);fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/orders/1');fixture.detectChanges();
    const element=fixture.nativeElement as HTMLElement;
    const nav=()=>element.querySelector('nav[aria-label="Logistics navigation"]')!;
    expect(nav().querySelector('a[href="/admin"]')).toBeNull();
    TestBed.inject(CartStore).add({productId:1,name:'Apples',price:3.99,weightKg:1});fixture.detectChanges();
    expect(nav().querySelector('a[href="/cart"]')?.textContent).toContain('Cart (1)');
    user.set({role:'Admin'});fixture.detectChanges();
    expect(nav().querySelector('a[href="/admin"]')).toBeTruthy();
    user.set(null);fixture.detectChanges();
    expect(nav().querySelector('a[href="/admin"]')).toBeNull();
  });
});
