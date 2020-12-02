import { map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { CacheService } from '../../shared/cache.service';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable()

export class OrderService {
  _orderTask: any = {};
  API_ENDPOINT = environment.apiEndpoint;
  constructor(private http: HttpClient, private cache: CacheService) {
  }
  getOrdersObject(): any {
    return this._orderTask;
  }
  getMasterData() {
    if (this.cache.has("masterData")) { return this.cache.get("masterData"); }
    return this.http.get(`${this.API_ENDPOINT}api/CRMMasterData`).pipe(map( res => {
        this.cache.set("masterData", res);
        return res;
      }));
  }
  //http://styloxcrm.azurewebsites.net/api/CRMLeadList?StartDate=5/1/2020&EndDate=5/30/2020&CustomerName=''&StatusID=1
  getAllOrders(StartDate,EndDate,TypeId,StatusId,userID) {
    return this.http.get(`${this.API_ENDPOINT}api/CRMOrderList?OrderFromdate=${StartDate}&OrderEnddate=${EndDate}&OrderTypeID=${TypeId}&OrderStatusID=${StatusId}&UserID=${userID}`).pipe(map( res => res));
  }
  getListOnType(type, userID) {
    return this.http.get(`${this.API_ENDPOINT}api/CRMCustomerforOrder?Type=${type}&UserID=${userID}`).pipe(map( res => res));
  }
  getOrderDetails(LeadId,UserId) {
    return this.http.get(`${this.API_ENDPOINT}api/CRMOrderDetail?OrderID=${LeadId}&LoginUserID=${UserId}`).pipe(map( res => res));
  }
  getAllProducts() {
    return this.http.get(`${this.API_ENDPOINT}api/CRMProductforOrder`).pipe(map( res => res));
  }
  createOrder(obj) {
    return this.http.post(`${this.API_ENDPOINT}api/CreateOrder`, obj).pipe(map( res => res));
  }
  getPrintableData(id,usedID) {
    return this.http.get(`${this.API_ENDPOINT}api/CRMOrderInvoice?OrderID=${id}&LoginUserID=${usedID}`).pipe(map( res => res));
  }
  voidOrder(id,userID) {
    const obj = {"OrderID": id, "CreatedBy": userID};
    return this.http.post(`${this.API_ENDPOINT}api/VoidOrder`, obj).pipe(map( res => res));
  }
  search(terms: Observable<string>,UserId) {
    return terms.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => this.searchEntries(term,UserId)))
  }

  searchEntries(term,UserId) {
    const type = +sessionStorage.getItem('type');
    return this.http
        .get(`${this.API_ENDPOINT}api/CRMCustomerforOrder?Type=${type}&UserID=${UserId}&SearchKey=${term}`).pipe(
          map(res => res)
        )
  }

  searchList(terms: Observable<string>,UserId) {
    return terms.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => this.searchListEntries(term,UserId)))
  }

  searchListEntries(term,UserId) {
    sessionStorage.setItem('searchOrderValue', term);
    return this.http
        .get(`${this.API_ENDPOINT}api/CRMOrderSearch?SearchKey=${term}&UserID=${UserId}`).pipe(
          map(res => res)
        )
  }
  sendSMS(url) {
   return this.http.get(url).pipe(map(res => res));
  }
}