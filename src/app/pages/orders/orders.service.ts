import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { CacheService } from '../../shared/cache.service';
import { environment } from 'environments/environment';

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
}