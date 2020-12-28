import { map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { CacheService } from '../../shared/cache.service';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable()

export class MiscIssueService {
  issueTask: any = {};
  queryUrl = '?search=';
  API_ENDPOINT = environment.apiEndpoint;
  constructor(private http: HttpClient, private cache: CacheService) {
  }
  getIssueObject(): any {
      return this.issueTask;
  }
  search(terms: Observable<string>,UserId) {
    return terms.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => this.searchEntries(term,UserId)))
  }

  searchEntries(term,UserId) {
    sessionStorage.setItem('searchIssueValue', term);
    return this.http
        .get(`${this.API_ENDPOINT}api/MiscIssueSearch?SearchKey=${term}&UserID=${UserId}`).pipe(
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
        .get(`${this.API_ENDPOINT}api/GetMiscIssueLot?SearchKey=${term}&UserID=${UserId}`).pipe(
          map(res => res)
        )
  }

  searchPurchaseList(terms: Observable<string>,UserId) {
    return terms.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => this.searchPuchaseListEntries(term,UserId)))
  }

  searchPuchaseListEntries(term,UserId) {
    return this.http
        .get(`${this.API_ENDPOINT}api/GetMiscIssuePurchase?SearchKey=${term}&UserID=${UserId}`).pipe(
          map(res => res)
        )
  }

  getMasterData(userID) {
    if (this.cache.has("issueMasterData")) { return this.cache.get("issueMasterData"); }
    return this.http.get(`${this.API_ENDPOINT}api/IMSMasterData?UserID=${userID}`).pipe(map( res => {
        this.cache.set("issueMasterData", res);
        return res;
      }));
  }
  //http://styloxcrm.azurewebsites.net/api/CRMLeadList?StartDate=5/1/2020&EndDate=5/30/2020&CustomerName=''&StatusID=1
  getAllMiscIssue(StartDate,EndDate,IssueType,Vendor,userID) {
    return this.http.get(`${this.API_ENDPOINT}api/MiscIssueList?StartDate=${StartDate}&EndDate=${EndDate}&IssueTypeID=${IssueType}&VendorID=${Vendor}&UserID=${userID}`).pipe(map( res => res));
  }
  getMiscIssueDetails(IssueId,UserId) {
    return this.http.get(`${this.API_ENDPOINT}api/MiscIssueDetail?MiscIssueID=${IssueId}&UserID=${UserId}`).pipe(map( res => res));
  }
  createMiscIssue(obj) {
    return this.http.post(`${this.API_ENDPOINT}api/CreateMiscIssue`, obj).pipe(map( res => res));
  }
  getPrintableData(id,usedID) {
    return this.http.get(`${this.API_ENDPOINT}api/MiscIssueInvoice?MiscIssueID=${id}&UserID=${usedID}`).pipe(map( res => res));
  }
}