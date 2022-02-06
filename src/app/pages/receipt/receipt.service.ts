import { map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { CacheService } from '../../shared/cache.service';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable()

export class ReceiptService {
  receiptTask: any = {};
  queryUrl = '?search=';
  API_ENDPOINT = environment.apiEndpoint;
  constructor(private http: HttpClient, private cache: CacheService) {
  }
  getReceiptObject(): any {
    return this.receiptTask;
  }
  search(terms: Observable<string>,UserId) {
    return terms.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => this.searchEntries(term,UserId)))
  }

  searchEntries(term,UserId) {
    sessionStorage.setItem('searchReceiptValue', term);
    return this.http
        .get(`${this.API_ENDPOINT}api/ReceiptSearch?SearchKey=${term}&UserID=${UserId}`).pipe(
          map(res => res)
        )
  }

  searchCustomer(terms: Observable<string>,UserId) {
    return terms.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => this.searchCustomerList(term,UserId)))
  }

  searchCustomerList(term,UserId) {
    const type = +sessionStorage.getItem('type');
    return this.http
        .get(`${this.API_ENDPOINT}api/CRMCustomerforOrder?Type=${type}&UserID=${UserId}&SearchKey=${term}`).pipe(
          map(res => res)
        )
  }

  getReceiptMasterData() {
    return this.http.get(`${this.API_ENDPOINT}api/ReceiptMasterData`).pipe(map( res => res));
  }
  //http://styloxcrm.azurewebsites.net/api/CRMLeadList?StartDate=5/1/2020&EndDate=5/30/2020&CustomerName=''&StatusID=1
  getAllReceipts(StartDate,EndDate,partyID,typeID,userID) {
    return this.http.get(`${this.API_ENDPOINT}api/ReceiptList?StartDate=${StartDate}&EndDate=${EndDate}&PartyTypeID=${partyID}&ReceiptTypeID=${typeID}&UserID=${userID}`).pipe(map( res => res));
  }
  getReceiptDetails(ReceiptId,UserId) {
    return this.http.get(`${this.API_ENDPOINT}api/ReceiptDetail?ReceiptID=${ReceiptId}&UserID=${UserId}`).pipe(map( res => res));
  }
  createReceipt(obj) {
    return this.http.post(`${this.API_ENDPOINT}api/CreateReceipt`, obj).pipe(map( res => res));
  }
}