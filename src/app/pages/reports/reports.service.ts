import { map} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { environment } from 'environments/environment';


@Injectable()

export class ReportsService {
  reportTask: any = {};
  API_ENDPOINT = environment.apiEndpoint;
  constructor(private http: HttpClient) {
  }
  
  getReportsObject(): any {
    return this.reportTask;
  }

  getAllReportTypes(UserId){
    return this.http.get(`${this.API_ENDPOINT}api/ReportList?UserID=${UserId}`).pipe(map( res => res));
  }

  getReportData(obj, flag) {
    let apiPath = '';
    if(flag == true) {
      apiPath = `api/ReportData?ReportType=${obj.ReportType}&LoginUserID=${obj.userID}`;
    } else {
      if(obj.SearchKey == ''){
        apiPath = `api/ReportData?ReportType=${obj.ReportType}&FromDate=${obj.StartDate}&EndDate=${obj.EndDate}&LoginUserID=${obj.userID}`
      } else {
        apiPath = `api/ReportData?ReportType=${obj.ReportType}&FromDate=${obj.StartDate}&EndDate=${obj.EndDate}&IsText=${obj.SearchKey}&LoginUserID=${obj.userID}`
      }
      
    }
    return this.http.get(`${this.API_ENDPOINT}${apiPath}`).pipe(map( res => res));
  }
}
