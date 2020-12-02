import { map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { CacheService } from '../../shared/cache.service';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable()

export class PurchaseOrderService {
  purchaseTask: any = {};
  queryUrl = '?search=';
  API_ENDPOINT = environment.apiEndpoint;
  constructor(private http: HttpClient, private cache: CacheService) {
  }
  getPurchaseObject(): any {
      return this.purchaseTask;
  }
  search(terms: Observable<string>,UserId) {
    return terms.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => this.searchEntries(term,UserId)))
  }

  searchEntries(term,UserId) {
    sessionStorage.setItem('searchPurchaseValue', term);
    return this.http
        .get(`${this.API_ENDPOINT}api/PurchaseOrderSearch?SearchKey=${term}&UserID=${UserId}`).pipe(
          map(res => res)
        )
  }

  getMasterData(userID) {
    if (this.cache.has("purchaseMasterData")) { return this.cache.get("purchaseMasterData"); }
    return this.http.get(`${this.API_ENDPOINT}api/IMSMasterData?UserID=${userID}`).pipe(map( res => {
        this.cache.set("purchaseMasterData", res);
        return res;
      }));
  }
  //http://styloxcrm.azurewebsites.net/api/CRMLeadList?StartDate=5/1/2020&EndDate=5/30/2020&CustomerName=''&StatusID=1
  getAllPuchaseOrders(StartDate,EndDate,SupplierID,typeId,userID) {
    return this.http.get(`${this.API_ENDPOINT}api/PurchaseOrderList?StartDate=${StartDate}&EndDate=${EndDate}&SupplierID=${SupplierID}&ItemTypeID=${typeId}&UserID=${userID}`).pipe(map( res => res));
  }
  getPurchaseOrderDetails(PurchaseId,UserId) {
    return this.http.get(`${this.API_ENDPOINT}api/PurchaseOrderDetail?PurchaseID=${PurchaseId}&UserID=${UserId}`).pipe(map( res => res));
  }
  createPurchaseOrder(obj) {
    return this.http.post(`${this.API_ENDPOINT}api/CreatePurchaseOrder`, obj).pipe(map( res => res));
  }
}