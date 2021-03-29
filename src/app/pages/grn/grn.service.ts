import { map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { CacheService } from '../../shared/cache.service';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable()

export class GRNService {
  _grnTask: any = {};
  API_ENDPOINT = environment.apiEndpoint;
  constructor(private http: HttpClient, private cache: CacheService) {
  }
  getGrnObject(): any {
    return this._grnTask;
  }
  getMasterData(userID) {
    if (this.cache.has("purchaseMasterData")) { return this.cache.get("purchaseMasterData"); }
      return this.http.get(`${this.API_ENDPOINT}api/IMSMasterData?UserID=${userID}`).pipe(map( res => {
        this.cache.set("purchaseMasterData", res);
        return res;
      }));
  }
  //http://styloxcrm.azurewebsites.net/api/CRMLeadList?StartDate=5/1/2020&EndDate=5/30/2020&CustomerName=''&StatusID=1
  getAllGrn(StartDate,EndDate,SourceID, VendorID,WareHouseID,userID) {
    return this.http.get(`${this.API_ENDPOINT}api/GRNList?GRNFromdate=${StartDate}&GRNEnddate=${EndDate}&SourceID=${SourceID}&WareHouseID=${WareHouseID}&VendorID=${VendorID}&LoginUserID=${userID}`).pipe(map( res => res));
  }
  // getListOnType(type, userID) {
  //   return this.http.get(`${this.API_ENDPOINT}api/CRMCustomerforOrder?Type=${type}&UserID=${userID}`).pipe(map( res => res));
  // }
  getGrnDetails(LeadId,UserId) {
    return this.http.get(`${this.API_ENDPOINT}api/GRNDetail?GoodReceiveHeaderID=${LeadId}&UserID=${UserId}`).pipe(map( res => res));
  }
  getAllProducts(userID) {
    if (this.cache.has("grnProductData")) { return this.cache.get("grnProductData"); }
    return this.http.get(`${this.API_ENDPOINT}api/ProductforGRN?LoginUserID=${userID}`).pipe(map( res => {
      this.cache.set("grnProductData", res);
      return res;
    }));
  }
  createGrn(obj) {
    return this.http.post(`${this.API_ENDPOINT}api/CreateGrn`, obj).pipe(map( res => res));
  }
  getPrintableData(id,usedID) {
    return this.http.get(`${this.API_ENDPOINT}api/GRNInvoice?GoodReceiveHeaderID=${id}&UserID=${usedID}`).pipe(map( res => res));
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
        .get(`${this.API_ENDPOINT}api/SearchLotforGRN?UserID=${UserId}&SearchKey=${term}`).pipe(
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
    sessionStorage.setItem('searchGrnValue', term);
    return this.http
        .get(`${this.API_ENDPOINT}api/GRNSearch?SearchKey=${term}&UserID=${UserId}`).pipe(
          map(res => res)
        )
  }
  // sendSMS(url) {
  //  return this.http.get(url).pipe(map(res => res));
  // }
}