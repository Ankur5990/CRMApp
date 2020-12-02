import { map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { CacheService } from '../../shared/cache.service';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable()

export class CostingService {
  costingTask: any = {};
  queryUrl = '?search=';
  API_ENDPOINT = environment.apiEndpoint;
  constructor(private http: HttpClient, private cache: CacheService) {
  }
  getCostingObject(): any {
      return this.costingTask;
  }
  search(terms: Observable<string>,UserId) {
    return terms.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => this.searchEntries(term,UserId)))
  }

  searchEntries(term,UserId) {
    sessionStorage.setItem('searchCostingValue', term);
    return this.http
        .get(`${this.API_ENDPOINT}api/CostingSearch?SearchKey=${term}&UserID=${UserId}`).pipe(
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
        .get(`${this.API_ENDPOINT}api/GetCostingLot?SearchKey=${term}&UserID=${UserId}`).pipe(
          map(res => res)
        )
  }
  getMasterData() {
    return this.http.get(`${this.API_ENDPOINT}api/ProductionMasterData`).pipe(map( res => res));
  }
  //http://styloxcrm.azurewebsites.net/api/CRMLeadList?StartDate=5/1/2020&EndDate=5/30/2020&CustomerName=''&StatusID=1
  getAllCostings(StartDate,EndDate,ProductType,FitType,userID) {
    return this.http.get(`${this.API_ENDPOINT}api/CostingList?StartDate=${StartDate}&EndDate=${EndDate}&ProductTypeID=${ProductType}&FitID=${FitType}&UserID=${userID}`).pipe(map( res => res));
  }
  getCostingDetails(CostingId,UserId) {
    return this.http.get(`${this.API_ENDPOINT}api/CostingDetail?CostingID=${CostingId}&UserID=${UserId}`).pipe(map( res => res));
  }
  createCosting(obj) {
    return this.http.post(`${this.API_ENDPOINT}api/CreateCosting`, obj).pipe(map( res => res));
  }
}