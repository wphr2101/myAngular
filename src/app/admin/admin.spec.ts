import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Admin } from './admin';
import { AuthService,AccountProfile } from '../account/auth-service';
import { apiConfig } from '../api.config';

describe('Admin',()=>{
  let fixture:ComponentFixture<Admin>,http:HttpTestingController;
  const user=signal<AccountProfile|null>(null);
  const url=apiConfig.baseUrl+'/api/admin';
  const profile={userId:2,userName:'admin.demo',customerId:2,name:'Admin',email:'admin@example.test',phone:null,role:'Admin'};
  const product={productId:1,name:'Oranges',stockQuantity:0};
  const render=()=>{fixture.detectChanges();TestBed.tick();fixture.detectChanges();};
  beforeEach(()=>{
    user.set(profile);
    TestBed.configureTestingModule({imports:[Admin],providers:[provideHttpClient(),provideHttpClientTesting(),
      {provide:AuthService,useValue:{user,checking:signal(false)}}]});
    fixture=TestBed.createComponent(Admin);http=TestBed.inject(HttpTestingController);
  });
  afterEach(()=>{fixture.destroy();http.verify();});
  function inventory(){render();const r=http.expectOne(url+'/inventory');expect(r.request.withCredentials).toBe(true);r.flush([product]);render();}
  function fill(){const c=fixture.componentInstance as any;c.form.setValue({productId:1,quantity:10,reason:'Demo delivery'});return c;}
  async function start(c:any){const done=c.restock();http.expectOne(apiConfig.baseUrl+'/api/auth/csrf').flush({requestToken:'test-only'});await Promise.resolve();return {done,r:http.expectOne(url+'/inventory/1/restock')};}
  it('does not load admin data for a customer',()=>{
    user.set({...profile,role:'Customer'});render();http.expectNone(()=>true);
    expect(fixture.nativeElement.textContent).toContain('Administrator access is required');
  });
  it('validates stock form without posting',async()=>{
    inventory();await (fixture.componentInstance as any).restock();http.expectNone(apiConfig.baseUrl+'/api/auth/csrf');
  });
  it('restocks with CSRF and clears the form only after success',async()=>{
    inventory();const c=fill();const {done,r}=await start(c);
    expect(r.request.headers.get('X-CSRF-TOKEN')).toBe('test-only');
    expect(r.request.body.quantity).toBe(10);r.flush({...product,stockQuantity:10});await done;
    render();http.expectOne(url+'/inventory').flush([{...product,stockQuantity:10}]);render();
    expect(fixture.nativeElement.textContent).toContain('Stock added');expect(c.form.controls.reason.value).toBe('');
  });
  it('preserves restock id and blocks navigation after an uncertain response',async()=>{
    inventory();const c=fill();const first=await start(c);const id=first.r.request.body.requestId;
    first.r.flush({}, {status:503,statusText:'Unavailable'});await first.done;render();
    expect(c.canLeave()).toBe(false);expect(c.form.disabled).toBe(true);
    const next=await start(c);expect(next.r.request.body.requestId).toBe(id);
    next.r.flush({...product,stockQuantity:10});await next.done;render();http.expectOne(url+'/inventory').flush([product]);render();
    expect(c.canLeave()).toBe(true);
  });
  it('prevents duplicate clicks while a restock is in flight',async()=>{
    inventory();const c=fill();const first=await start(c);await c.restock();http.expectNone(apiConfig.baseUrl+'/api/auth/csrf');
    first.r.flush({}, {status:409,statusText:'Conflict'});await first.done;
  });
  it('clears loaded customer information when admin logs out',()=>{
    inventory();const c=fixture.componentInstance as any;c.choose('orders');render();
    http.expectOne(url+'/orders').flush({items:[{orderId:1,customerName:'Private customer',orderDate:'2026-10-17T00:00:00Z',status:'Pending',paymentStatus:'Unpaid',subtotal:10,stockDeducted:true}],hasMore:false});render();
    expect(fixture.nativeElement.textContent).toContain('Private customer');user.set(null);render();
    expect(fixture.nativeElement.textContent).not.toContain('Private customer');
  });
  it('blocks shipment button until payment is recorded',()=>{
    inventory();const c=fixture.componentInstance as any;c.choose('orders');render();
    http.expectOne(url+'/orders').flush({items:[{orderId:1,customerName:'Demo',orderDate:'2026-10-17T00:00:00Z',status:'Pending',paymentStatus:'Unpaid',subtotal:10,stockDeducted:true}],hasMore:false});render();
    const buttons=Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    expect(buttons.find(b=>b.textContent?.includes('Mark shipped'))?.disabled).toBe(true);
    expect(buttons.find(b=>b.textContent?.includes('Mark paid'))?.disabled).toBe(false);
  });
});
