import { map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { CacheService } from '../../shared/cache.service';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable()

export class QuotationService {
  _quotationTask: any = {};
  API_ENDPOINT = environment.apiEndpoint;
  constructor(private http: HttpClient, private cache: CacheService) {
  }
  getQuotationObject(): any {
    return this._quotationTask;
  }
  getMasterData() {
    if (this.cache.has("masterData")) { return this.cache.get("masterData"); }
    return this.http.get(`${this.API_ENDPOINT}api/CRMMasterData`).pipe(map( res => {
        this.cache.set("masterData", res);
        return res;
      }));
  }
  getImsMasterData(userID) {
    if (this.cache.has("purchaseMasterData")) { return this.cache.get("purchaseMasterData"); }
    return this.http.get(`${this.API_ENDPOINT}api/IMSMasterData?UserID=${userID}`).pipe(map( res => {
      this.cache.set("purchaseMasterData", res);
      return res;
    }));
  }
  //http://styloxcrm.azurewebsites.net/api/CRMLeadList?StartDate=5/1/2020&EndDate=5/30/2020&CustomerName=''&StatusID=1
  getAllQuotation(StartDate,EndDate,TypeId,WareHouseID,userID) {
    return this.http.get(`${this.API_ENDPOINT}api/QuotationList?QuotationFromdate=${StartDate}&QuotationEnddate=${EndDate}&QuotationTypeID=${TypeId}&UserID=${userID}&WarehouseID=${WareHouseID}`).pipe(map( res => res));
  }

  // getListOnType(type, userID) {
  //   return this.http.get(`${this.API_ENDPOINT}api/CRMCustomerforOrder?Type=${type}&UserID=${userID}`).pipe(map( res => res));
  // }

  getQuotationDetails(QuotationID,UserId) {
    return this.http.get(`${this.API_ENDPOINT}api/QuotationDetail?QuotationID=${QuotationID}&LoginUserID=${UserId}`).pipe(map( res => res));
  }

  getAllProducts() {
    return this.http.get(`${this.API_ENDPOINT}api/CRMProductforOrder`).pipe(map( res => res));
  }

  createQuotation(obj) {
    return this.http.post(`${this.API_ENDPOINT}api/CreateQuotation`, obj).pipe(map( res => res));
  }

  getPrintableData(id,usedID) {
    return this.http.get(`${this.API_ENDPOINT}api/QuotationInvoice?QuotationID=${id}&LoginUserID=${usedID}`).pipe(map( res => res));
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
    sessionStorage.setItem('searchQuotationValue', term);
    return this.http
        .get(`${this.API_ENDPOINT}api/QuotationSearch?SearchKey=${term}&UserID=${UserId}`).pipe(
          map(res => res)
        )
  }

  sendSMS(url) {
   return this.http.get(url).pipe(map(res => res));
  }
}