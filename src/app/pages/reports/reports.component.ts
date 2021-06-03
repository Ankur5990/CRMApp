import { Component } from '@angular/core';
import { NotificationsService } from 'angular2-notifications';
import { ngxCsv } from 'ngx-csv';
import { UserService } from '../../shared/user.service';
import { ReportsService } from './reports.service';

@Component({
    selector: '',
    templateUrl: './reports.component.html',
    styleUrls: ['./reports.component.scss']
})

export class ReportsComponent {
    showLoader = false;
    flag;
    reportTask;
    allReportType = [];
    userID;
    dateIsRequired = false;
    header = [];
    reportData = [];
    noData = '';
    todaysDate;
    refreshMessage = 'Please Click on View Report to get the Data';
    constructor(private reportService: ReportsService, private userService: UserService, private notification: NotificationsService) { 
        
    }
    ngOnInit() {
        const now = new Date();
        this.todaysDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        this.userID = localStorage.getItem('UserLoginId');
        this.reportTask = this.reportService.getReportsObject();
        this.reportTask.ReportType = 0;
        this.reportTask.StartDate = this.todaysDate;
        this.reportTask.EndDate = this.todaysDate;
        this.getAllReportTypes();
    }

    refreshDataHandler() {
        this.header = [];
        this.reportData = [];
        if(this.reportTask.ReportType == 0) {
            this.dateIsRequired = false;
            return;
        }
        const report = this.allReportType.filter(report => report.ReportType == this.reportTask.ReportType);
        this.dateIsRequired = report[0].IsDateRequired == 1 ? true : false;
        if(this.dateIsRequired == false) {
            this.flag = true;
            this.getReportData(this.flag);
        } else {
            this.refreshMessage = 'Please Click on View Report to get the Data';
        }
    }

    dateChangeHandler() {
        this.header = [];
        this.reportData = [];
        this.refreshMessage = 'Please Click on View Report to get the Data';
    }

    getReportData(flag) {
        const obj = {
            ReportType: this.reportTask.ReportType,
            StartDate: `${this.reportTask.StartDate.month}/${this.reportTask.StartDate.day}/${this.reportTask.StartDate.year}`,
            EndDate: `${this.reportTask.EndDate.month}/${this.reportTask.EndDate.day}/${this.reportTask.EndDate.year}`,
            userID: this.userID
        }
        this.showLoader = true;
        this.reportService.getReportData(obj, flag).subscribe(resp => {
            this.showLoader = false;
            if(resp['ReportData'] && resp['ReportData'].length > 0) {
                this.header = Object.keys(resp['ReportData'][0]);
                this.reportData = resp['ReportData'];
                this.refreshMessage = '';
            } else {
                this.header = [];
                this.reportData = [];
                this.noData = 'No Reports Found';
                this.refreshMessage = '';
            }
        }, err => {
            this.showLoader = false;
            this.header = [];
            this.reportData = [];
            this.notification.error('Something went wrong while getting reports');
        })
    }

    exportToCSV() {
        const options = { 
          headers: this.header, 
          nullToEmptyString: true,
        };
        new ngxCsv(this.reportData, 'Report-Data', options);
    }

    getAllReportTypes() {
        this.showLoader = true;
        this.reportService.getAllReportTypes(this.userID).subscribe(data => {
            this.showLoader = false;
            this.allReportType = data['ReportList'];
        }, err=> {
            this.showLoader = false;
            this.notification.error('Something went wrong while fetching report type !!!');
        })
    }
	
}
