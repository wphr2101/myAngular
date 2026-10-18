import { Component, effect, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, forkJoin } from 'rxjs';
import { AuthService } from '../account/auth-service';
import { apiConfig, apiRequestOptions } from '../api.config';
import { OrderReceipt } from '../shopping/checkout-service';

interface Inventory { productId:number; name:string; stockQuantity:number; }
interface Summary { orderId:number; orderDate:string; status:string; paymentStatus:string; customerName:string; subtotal:number; stockDeducted:boolean; }
interface Page { items:Summary[]; hasMore:boolean; }
interface Movement { movementId:number; productId:number; productName:string; quantityChange:number; stockAfter:number; kind:string; reason:string; actor:string; createdAt:string; orderId:number|null; }
interface Detail { order:OrderReceipt; stockDeducted:boolean; events:{eventType:string;actor:string;createdAt:string}[]; }

@Component({selector:'app-admin',imports:[CurrencyPipe,DatePipe,ReactiveFormsModule],templateUrl:'./admin.html',styleUrls:['../shopping/shopping.css','./admin.css']})
export class Admin {
  protected readonly auth=inject(AuthService);
  private readonly http=inject(HttpClient);
  private readonly url=apiConfig.baseUrl+'/api/admin';
  private readonly options={...apiRequestOptions,withCredentials:true};
  protected readonly tab=signal<'inventory'|'orders'|'movements'>('inventory');
  protected readonly inventory=signal<Inventory[]>([]);
  protected readonly orders=signal<Page|null>(null);
  protected readonly movements=signal<Movement[]>([]);
  protected readonly detail=signal<Detail|null>(null);
  protected readonly detailId=signal<number|null>(null);
  protected readonly cursor=signal<number|null>(null);
  protected readonly loading=signal(false);
  protected readonly busy=signal(false);
  protected readonly uncertain=signal(false);
  protected readonly error=signal('');
  protected readonly message=signal('');
  private readonly revision=signal(0);
  private pending:{userId:number;productId:number;requestId:string;quantity:number;reason:string}|null=null;
  protected readonly form=new FormGroup({
    productId:new FormControl(0,{nonNullable:true,validators:[Validators.min(1)]}),
    quantity:new FormControl(1,{nonNullable:true,validators:[Validators.required,Validators.min(1),Validators.max(100000),Validators.pattern(/^\d+$/)]}),
    reason:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.pattern(/\S/),Validators.maxLength(250)]}),
  });
  constructor(){
    effect(cleanup=>{
      const user=this.auth.user(); const checking=this.auth.checking();
      const tab=this.tab(),cursor=this.cursor(),id=this.detailId(); this.revision();
      this.inventory.set([]);this.orders.set(null);this.movements.set([]);this.detail.set(null);this.loading.set(false);
      if(checking || user?.role!=='Admin')return;
      this.loading.set(true);
      const base=tab==='orders'?'orders'+(cursor?'?beforeId='+cursor:''):tab;
      const read=tab==='orders'&&id?forkJoin([this.http.get<Page>(this.url+'/'+base,this.options),this.http.get<Detail>(this.url+'/orders/'+id,this.options)]):
        this.http.get<unknown>(this.url+'/'+base,this.options);
      const sub=read.subscribe({next:value=>{
        if(tab==='inventory')this.inventory.set(value as Inventory[]);
        else if(tab==='movements')this.movements.set(value as Movement[]);
        else if(id){const pair=value as [Page,Detail];this.orders.set(pair[0]);this.detail.set(pair[1]);}
        else this.orders.set(value as Page);
        this.loading.set(false);
      },error:()=>{this.error.set('Unable to load administration data. Refresh your session or retry.');this.loading.set(false);}});
      cleanup(()=>sub.unsubscribe());
    });
    effect(()=>{
      const id=this.auth.user()?.userId;
      if(this.pending && this.pending.userId!==id){this.pending=null;this.uncertain.set(false);this.form.enable();}
    });
  }
  canLeave(){return !this.busy()&&!this.uncertain();}
  protected choose(tab:'inventory'|'orders'|'movements'){
    if(!this.canLeave())return;
    this.error.set('');this.message.set('');this.detailId.set(null);this.tab.set(tab);
  }
  protected refresh(){if(this.busy())return;this.error.set('');this.revision.update(n=>n+1);}
  protected latest(){this.cursor.set(null);this.detailId.set(null);}
  protected older(){const items=this.orders()?.items;if(items?.length){this.cursor.set(items[items.length-1].orderId);this.detailId.set(null);}}
  protected select(id:number){if(!this.busy())this.detailId.set(id);}
  protected async restock(){
    if(this.busy())return;
    const user=this.auth.user();if(user?.role!=='Admin')return;
    if(!this.pending){
      if(this.form.invalid){this.form.markAllAsTouched();this.error.set('Choose a product, a whole-number quantity and a reason.');return;}
      const v=this.form.getRawValue();this.pending={userId:user.userId,...v,reason:v.reason.trim(),requestId:crypto.randomUUID()};
    }
    const pending=this.pending;
    await this.mutate('/inventory/'+pending.productId+'/restock',{requestId:pending.requestId,quantity:pending.quantity,reason:pending.reason},true);
  }
  protected async change(order:Summary|OrderReceipt,action:'paid'|'shipped'){
    if(this.busy()||this.uncertain())return;
    await this.mutate('/orders/'+order.orderId+'/'+action,{},false);
  }
  private async mutate(path:string,body:unknown,restock:boolean){
    const owner=this.auth.user()?.userId;if(!owner)return;
    this.busy.set(true);this.error.set('');this.message.set('');if(restock)this.form.disable();
    let submitted=false;
    try{
      const csrf=await firstValueFrom(this.http.get<{requestToken:string}>(apiConfig.baseUrl+'/api/auth/csrf',this.options));
      if(this.auth.user()?.userId!==owner)return;
      submitted=true;
      await firstValueFrom(this.http.post(this.url+path,body,{...this.options,headers:new HttpHeaders(apiRequestOptions.headers).set('X-CSRF-TOKEN',csrf.requestToken)}));
      if(this.auth.user()?.userId!==owner)return;
      this.pending=null;this.uncertain.set(false);this.form.enable();
      this.message.set(restock?'Stock added.':'Simulated order status updated. No payment was collected.');
      if(restock){this.form.controls.quantity.setValue(1);this.form.controls.reason.reset();}
      this.revision.update(n=>n+1);
    }catch(error){
      if(this.auth.user()?.userId!==owner)return;
      const e=error as HttpErrorResponse;
      if(restock&&submitted&&(e.status===0||e.status>=500)){
        this.uncertain.set(true);this.error.set('Restock result is unconfirmed. Retry the same restock before navigating or reloading.');
      }else{
        this.pending=null;this.uncertain.set(false);this.form.enable();
        this.error.set(e.status===401||e.status===403?'Administrator session unavailable. Sign in again.':
          e.error?.message??'Unable to complete the action. Retry to confirm its status.');
      }
    }finally{this.busy.set(false);}
  }
}
