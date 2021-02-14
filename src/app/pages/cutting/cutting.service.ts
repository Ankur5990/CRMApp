import { map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { CacheService } from '../../shared/cache.service';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable()

export class CuttingService {
  cuttingTask: any = {};
  queryUrl = '?search=';
  API_ENDPOINT = environment.apiEndpoint;
  constructor(private http: HttpClient, private cache: CacheService) {
  }
  getCuttingObject(): any {
    return this.cuttingTask;
  }
  search(terms: Observable<string>,UserId) {
    return terms.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => this.searchEntries(term,UserId)))
  }

  searchEntries(term,UserId) {
    sessionStorage.setItem('searchCuttingValue', term);
    return this.http
        .get(`${this.API_ENDPOINT}api/CuttingSearch?SearchKey=${term}&UserID=${UserId}`).pipe(
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
    // sessionStorage.setItem('searchOrderValue', term);
    return this.http
        .get(`${this.API_ENDPOINT}api/GetCuttingSortNumber?SearchKey=${term}&UserID=${UserId}`).pipe(
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

  getProductionMaster() {
    return this.http.get(`${this.API_ENDPOINT}api/ProductionMasterData`).pipe(map(res => res));
  }
  //http://styloxcrm.azurewebsites.net/api/CRMLeadList?StartDate=5/1/2020&EndDate=5/30/2020&CustomerName=''&StatusID=1
  getAllCuttings(StartDate,EndDate,FitType,userID) {
    return this.http.get(`${this.API_ENDPOINT}api/CuttingList?StartDate=${StartDate}&EndDate=${EndDate}&FitID=${FitType}&UserID=${userID}`).pipe(map( res => res));
  }
  getCuttingDetails(CuttingId,UserId) {
    return this.http.get(`${this.API_ENDPOINT}api/CuttingDetail?CuttingID=${CuttingId}&UserID=${UserId}`).pipe(map( res => res));
  }
  createCutting(obj) {
    return this.http.post(`${this.API_ENDPOINT}api/CreateCutting`, obj).pipe(map( res => res));
  }
}