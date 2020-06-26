import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { map } from 'rxjs/operators';

@Injectable()

export class DashboardService {
    API_ENDPOINT = environment.apiEndpoint;
    constructor(private http: HttpClient) { }
    getDashboardData(UserId) {
        return this.http.get(`${this.API_ENDPOINT}api/CRMDashboard?UserID=${UserId}`).pipe(map( res => res));
    }
}