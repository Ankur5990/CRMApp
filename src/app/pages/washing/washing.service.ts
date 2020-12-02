import { map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { CacheService } from '../../shared/cache.service';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable()

export class WashingService {
  washingTask: any = {};
  queryUrl = '?search=';
  API_ENDPOINT = environment.apiEndpoint;
  constructor(private http: HttpClient, private cache: CacheService) {
  }
  getWashingObject(): any {
    return this.washingTask;
  }
  search(terms: Observable<string>,UserId) {
    return terms.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => this.searchEntries(term,UserId)))
  }

  searchEntries(term,UserId) {
    sessionStorage.setItem('searchWashingValue', term);
    return this.http
        .get(`${this.API_ENDPOINT}api/WashingSearch?SearchKey=${term}&UserID=${UserId}`).pipe(
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
    return this.http
        .get(`${this.API_ENDPOINT}api/GetWashingLot?SearchKey=${term}&UserID=${UserId}`).pipe(
          map(res => res)
        )
  }

  getMasterData() {
    return this.http.get(`${this.API_ENDPOINT}api/ProductionMasterData`).pipe(map( res => res));
  }
  //http://styloxcrm.azurewebsites.net/api/CRMLeadList?StartDate=5/1/2020&EndDate=5/30/2020&CustomerName=''&StatusID=1
  getAllWashings(StartDate,EndDate,washerId,typeID,userID) {
    return this.http.get(`${this.API_ENDPOINT}api/WashingList?StartDate=${StartDate}&EndDate=${EndDate}&WasherID=${washerId}&WashingTypeID=${typeID}&UserID=${userID}`).pipe(map( res => res));
  }
  getWashingDetails(WashingId,UserId) {
    return this.http.get(`${this.API_ENDPOINT}api/WashingDetail?WashingID=${WashingId}&UserID=${UserId}`).pipe(map( res => res));
  }
  createWashing(obj) {
    return this.http.post(`${this.API_ENDPOINT}api/CreateWashing`, obj).pipe(map( res => res));
  }
  getPrintableData(id,userID) {
    return this.http.get(`${this.API_ENDPOINT}api/WashingInvoice?WashingID=${id}&UserID=${userID}`).pipe(map( res => res));
  }
}