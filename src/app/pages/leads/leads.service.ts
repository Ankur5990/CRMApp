import { map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { CacheService } from '../../shared/cache.service';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable()

export class LeadService {
  _leadTask: any = {};
  queryUrl = '?search=';
  API_ENDPOINT = environment.apiEndpoint;
  constructor(private http: HttpClient, private cache: CacheService) {
  }
  getLeadObject(): any {
      return this._leadTask;
  }
  search(terms: Observable<string>,UserId) {
    return terms.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => this.searchEntries(term,UserId)))
  }

  searchEntries(term,UserId) {
    sessionStorage.setItem('searchvalue', term);
    return this.http
        .get(`${this.API_ENDPOINT}api/CRMLeadSearch?SearchKey=${term}&UserID=${UserId}`).pipe(
          map(res => res)
        )
  }
  checkOrder(LeadId,UserId) {
    return this.http.get(`${this.API_ENDPOINT}api/CRMCheckOrder?LeadID=${LeadId}&UserID=${UserId}`).pipe(map( res => res));
  }
  getMasterData() {
    if (this.cache.has("masterData")) { return this.cache.get("masterData"); }
    return this.http.get(`${this.API_ENDPOINT}api/CRMMasterData`).pipe(map( res => {
        this.cache.set("masterData", res);
        return res;
      }));
  }
  //http://styloxcrm.azurewebsites.net/api/CRMLeadList?StartDate=5/1/2020&EndDate=5/30/2020&CustomerName=''&StatusID=1
  getAllLeads(StartDate,EndDate,PriorityId,StatusId,userID) {
    return this.http.get(`${this.API_ENDPOINT}api/CRMLeadList?StartDate=${StartDate}&EndDate=${EndDate}&PriorityID=${PriorityId}&StatusID=${StatusId}&UserID=${userID}`).pipe(map( res => res));
  }
  getLeadDetails(LeadId,UserId) {
    return this.http.get(`${this.API_ENDPOINT}api/CRMLeadDetail?LeadID=${LeadId}&UserID=${UserId}`).pipe(map( res => res));
  }
  createLead(obj) {
    return this.http.post(`${this.API_ENDPOINT}api/CreateLead`, obj).pipe(map( res => res));
  }
}