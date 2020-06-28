import { Component, OnInit } from '@angular/core';
import { LeadService } from '../leads.service';
import { UserService } from '../../../shared/user.service';
import { NotificationsService } from 'angular2-notifications';
import { GenericSort } from 'app/shared/pipes/generic-sort.pipe';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CacheService } from 'app/shared/cache.service';
import { SharedService } from 'app/shared/shared.service';
import { ActivatedRoute } from '@angular/router';
import { ngxCsv } from 'ngx-csv/ngx-csv';

@Component({
  selector: 'app-leads-list',
  templateUrl: './leads-list.component.html',
  styleUrls: ['./leads-list.component.scss']
})
export class LeadsListComponent implements OnInit {
  leadTask;
  todaysDate;
  buttonAction = false;
  allLeadsList = [];
  noLeadFound = '';
  refreshMessage = "Please click View button to get latest data";
  showLoader = false;
  lookUpData;
  allCustomer;
  allStatus;
  userID;

  constructor(protected userService: UserService, private leadService: LeadService,
    private sharedService: SharedService, private activatedRoute: ActivatedRoute,
    protected cacheService: CacheService, protected modalService: NgbModal,
    private notification: NotificationsService, private genericSort: GenericSort) { }

  ngOnInit() {
    this.userID = localStorage.getItem('UserLoginId');
    this.allLeadsList = [];
    this.leadTask = this.leadService.getLeadObject();
    this.leadTask = JSON.parse(JSON.stringify(this.leadTask));
    this.leadTask.Status = 1;
    this.leadTask.Priority = 1;
    const now = new Date();
    this.todaysDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    this.leadTask.startDate = this.todaysDate;
    this.leadTask.endDate = this.todaysDate;
    this.getMasterData();                    
    this.validateData();
  }

  getMasterData() {
    this.showLoader = true;
    this.leadService.getMasterData().subscribe(res => {
      this.showLoader = false;
      let lookUpData = JSON.parse(JSON.stringify(res));
      this.allCustomer = lookUpData.Customer;
      this.allStatus = lookUpData.LeadStatus;
    },(error)=> {
      this.showLoader = false;
      this.notification.error('Error','Error While Lookup Master Data');
    })
  }

  printTable() {
    var divToPrint = document.getElementById("lead-container");  
    let newWin = window.open("");  
    newWin.document.write(divToPrint.outerHTML);  
    newWin.print();  
    newWin.close();
  }
  exportToCSV() {
    const report = [];
    this.allLeadsList.forEach((leadInfo) => {
      report.push({
        LeadNumber: leadInfo.LeadNumber,
        LeadType: leadInfo.LeadType,
        LeadSource: leadInfo.LeadSource,
        Priority: leadInfo.PriorityDesc,
        CustomerName: leadInfo.CustomerName,
        Address: leadInfo.Address,
        City: leadInfo.CityName,
        State: leadInfo.StateName,
        Zip: leadInfo.Zip,
        ShopName: leadInfo.ShopName,
        Quantity: leadInfo.Quantity,
        LeadDate: leadInfo.LeadDate,
        FollowUpDate: leadInfo.FollowUPDate,
        LeadStatus: leadInfo.LeadStatus,
      });
    });

    const options = { 
      headers: ['Lead Number', 'Lead Type', 'Lead Source','Priority','CustomerName','Address','City', 'State', 'Zip', 'Shop Name', 'Quantity', 'Lead Date', 'FollowUp Date', 'Lead Status'], 
      nullToEmptyString: true,
    };
    new ngxCsv(report, 'Lead-List', options);
  }
  refreshDataHandler() {
    this.validateData();
    if (this.allLeadsList.length || this.noLeadFound != '') {
      this.allLeadsList = [];
      this.noLeadFound = "";
      this.refreshMessage = "Please click View button to get latest data";
    }
  }

  validateData() {
    if (this.leadTask.Priority != 0 && this.leadTask.Status !=0) {
      this.buttonAction = true;
      return true;
    } else {
      this.buttonAction = false;
      return false;
    }
  }

  getAllLeads() {
    const leadTask = JSON.parse(JSON.stringify(this.leadTask));
    const startDate = `${leadTask.startDate.month}/${leadTask.startDate.day}/${leadTask.startDate.year}`;
    const endDate = `${leadTask.endDate.month}/${leadTask.endDate.day}/${leadTask.endDate.year}`;
    this.showLoader = true;
    this.leadService.getAllLeads(startDate,endDate,leadTask.Priority,leadTask.Status, this.userID).subscribe((res) => {
      this.showLoader = false;
      if (!res['LeadList'].length) {
        this.allLeadsList = [];
        this.noLeadFound = "No Lead Found";
      } else {
        this.allLeadsList = res['LeadList'];
        this.refreshMessage = "";
        this.noLeadFound = "";
      }
    },(error) => {
      this.showLoader = false;
      this.allLeadsList = [];
      this.notification.error('Error','Something went wrong, Please try later !!!');
    })
  }
}
