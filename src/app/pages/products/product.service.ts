import { map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { CacheService } from '../../shared/cache.service';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable()

export class ProductService {
  productTask: any = {};
  queryUrl = '?search=';
  API_ENDPOINT = environment.apiEndpoint;
  constructor(private http: HttpClient, private cache: CacheService) {
  }
  getProductObject(): any {
    return this.productTask;
  }
  search(terms: Observable<string>,UserId) {
    return terms.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => this.searchEntries(term,UserId)))
  }

  searchEntries(term,UserId) {
    sessionStorage.setItem('searchProductValue', term);
    return this.http
        .get(`${this.API_ENDPOINT}api/ProductSearch?SearchKey=${term}&UserID=${UserId}`).pipe(
          map(res => res)
        )
  }

  getMasterData(userID) {
    return this.http.get(`${this.API_ENDPOINT}api/IMSMasterData?UserID=${userID}`).pipe(map( res => res));
  }
  getAllProducts(typeID, GenderID, FitID, color, category, source, userID) {
    return this.http.get(`${this.API_ENDPOINT}api/ProductList?ProductTypeID=${typeID}&GenderID=${GenderID}&FitID=${FitID}&ColorID=${color}&ProductCatogeryID=${category}&SourceID=${source}&LoginUserID=${userID}`).pipe(map( res => res));
  }
  getProductDetails(productId,UserId) {
    return this.http.get(`${this.API_ENDPOINT}api/ProductDetail?ProductID=${productId}&UserID=${UserId}`).pipe(map( res => res));
  }
  createProduct(obj) {
    return this.http.post(`${this.API_ENDPOINT}api/CreateProduct`, obj).pipe(map( res => res));
  }
  // getPrintableData(id,userID) {
  //   return this.http.get(`${this.API_ENDPOINT}api/WashingInvoice?WashingID=${id}&UserID=${userID}`).pipe(map( res => res));
  // }
}