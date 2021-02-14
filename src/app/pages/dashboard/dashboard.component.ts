import { Component } from '@angular/core';
import { DashboardService } from './dashboard.service';
import { NotificationsService } from 'angular2-notifications';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls:['./dashboard.component.scss']
})

export class DashboardComponent {
    UserId = '';
    allHotLeads = [];
    allFollowUpLeads = [];
    allLeads;
    allOrders;
    allLotSummary;
    allLotDetails = [];
    showLoader = false;
    constructor(private dashboradService: DashboardService, private notification: NotificationsService){}
    ngOnInit() {
        this.UserId = localStorage.getItem('UserLoginId');
        this.getDashboardData();
    }
    getDashboardData() {
        this.showLoader = true;
        this.dashboradService.getDashboardData(this.UserId).subscribe(res => {
            this.showLoader = false;
            if(res['FollowupLead']) {
                this.allFollowUpLeads = res['FollowupLead'];
            }
            if(res['HotLead']) {
                this.allHotLeads = res['HotLead'];
            }
            if(res['LeadCount']) {
                this.allLeads = res['LeadCount'][0];
            }
            if(res['OrderCount']) {
                this.allOrders = res['OrderCount'][0];
            }
            if(res['LOTSummary']) {
                this.allLotSummary = res['LOTSummary'][0];
            }
            if(res['PendingLOTDetail']) {
                this.allLotDetails = res['PendingLOTDetail'];
            }
        }, err=> {
            this.showLoader = false;
            this.notification.error('Error', 'Something went wrong while getting data !!!');
        })
    }

}