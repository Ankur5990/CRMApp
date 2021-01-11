import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../shared/user.service';
import { NotificationsService } from 'angular2-notifications';
import { GenericSort } from 'app/shared/pipes/generic-sort.pipe';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CacheService } from 'app/shared/cache.service';
import { SharedService } from 'app/shared/shared.service';
import { ActivatedRoute } from '@angular/router';
import { ngxCsv } from 'ngx-csv/ngx-csv';
import { Subject } from 'rxjs';
import { WashingService } from '../washing.service';

@Component({
  selector: 'app-washing-list',
  templateUrl: './washing-list.component.html',
  styleUrls: ['./washing-list.component.scss']
})
export class WashingListComponent implements OnInit {
  washingListTask;
  todaysDate;
  buttonAction = false;
  allWashingList = [];
  allWasher = [];
  allWasherType = [];
  noWashingFound = '';
  refreshMessage = "Please click View button to get latest data";
  showLoader = false;
  lookUpData;
  allCustomer;
  userID;
  searchWashingTerm$ = new Subject<string>();
  results;
  searchWashingKey = '';
  printHeaderInfo;
  printDetailInfo;
  constructor(protected userService: UserService, private washingService: WashingService,
    private sharedService: SharedService, private activatedRoute: ActivatedRoute,
    protected cacheService: CacheService, protected modalService: NgbModal,
    private notification: NotificationsService, private genericSort: GenericSort) { }

  ngOnInit() {
    this.userID = localStorage.getItem('UserLoginId');
    this.allWashingList = [];
    this.washingListTask = this.washingService.getWashingObject();
    this.washingListTask = JSON.parse(JSON.stringify(this.washingListTask));
    this.washingListTask.Washer = 1;
    this.washingListTask.WasherType = 1;
    this.washingListTask.searchby = 1;
    const now = new Date();
    this.todaysDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    this.washingListTask.startDate = this.todaysDate;
    this.washingListTask.endDate = this.todaysDate;
    if (this.cacheService.has("listWashingFilterData")) {
      this.cacheService.get("listWashingFilterData").subscribe((res) => {
        this.washingListTask = JSON.parse(JSON.stringify(res));
        if(res.searchby == 1) {
          this.searchWashingKey = res.searchtext;
        } else {
          this.searchWashingKey = '';
        }
        if(this.cacheService.has('allWashingList')) {
          this.cacheService.get('allWashingList').subscribe(res => {
            this.allWashingList = JSON.parse(JSON.stringify(res));
          })
        }
      });
    }
    if(this.cacheService.has("redirectToWashingList")) {
      this.cacheService.deleteCache('redirectToWashingList');
      this.cacheService.get('allWashingList').subscribe(res => {
        this.allWashingList = JSON.parse(JSON.stringify(res));
      })
    }
    if(this.cacheService.has("redirectAfterWashingSave")) {
      this.cacheService.deleteCache('redirectAfterWashingSave');
      this.allWashingList = [];
      if(this.washingListTask.searchby == 2) {
        this.validateData();
        if(this.buttonAction) {
          this.getAllWashings();
        }
      } else if(this.washingListTask.searchby == 1) {
        this.showLoader = true;
        this.washingService.searchEntries(this.searchWashingKey, this.userID).subscribe(res => {
          this.showLoader = false;
          if(res['WashingList'].length == 0) {
            this.allWashingList = [];
            this.noWashingFound = "No Washing Found";
            this.refreshMessage = '';
          } else {
            this.allWashingList = res['WashingList'];
            if(res['WashingList'].length > 0) {
              this.cacheService.set("allWashingList", this.allWashingList);
              if(sessionStorage.getItem('searchWashingValue')) {
                this.washingListTask.searchtext = sessionStorage.getItem('searchWashingValue');
              }
              this.cacheService.set("listWashingFilterData", this.washingListTask);
            }
          }
        }, err=> {
          this.showLoader = false;
          this.notification.error('Error', 'Having Problem in loading latest data !!!');
        })
      }
    }
    this.getMasterData();                    
    this.validateData();
    this.washingService.search(this.searchWashingTerm$,this.userID)
    .subscribe(results => {
      if(results['WashingList'].length == 0) {
        this.allWashingList = [];
        this.noWashingFound = "No Washing Found";
        this.refreshMessage = '';
      } else {
        this.allWashingList = results['WashingList'];
        if(results['WashingList'].length > 0) {
          this.cacheService.set("allWashingList", this.allWashingList);
          if(sessionStorage.getItem('searchWashingValue')) {
            this.washingListTask.searchtext = sessionStorage.getItem('searchWashingValue');
          }
          this.cacheService.set("listWashingFilterData", this.washingListTask);
        }
      }
    });
  }

  getMasterData() {
    this.showLoader = true;
    this.washingService.getMasterData().subscribe(res => {
      this.showLoader = false;
      let lookUpData = JSON.parse(JSON.stringify(res));
      this.allWasher = lookUpData.Washer;
      this.allWasherType = lookUpData.WashingType;
    },(error)=> {
      this.showLoader = false;
      this.notification.error('Error','Error While Lookup Master Data');
    })
  }

  printTable() {
    var divToPrint = document.getElementById("washing-container");  
    let newWin = window.open("");  
    newWin.document.write(divToPrint.outerHTML);  
    newWin.print();  
    newWin.close();
  }
  exportToCSV() {
    const report = [];
    this.allWashingList.forEach((washingInfo) => {
      report.push({
        LotNumber: washingInfo.LotID,
        Washer: washingInfo.Washer,
        WashingType: washingInfo.WashingType,
        QtyIssue: washingInfo.QtyIssue,
        QtyReceive: washingInfo.QtyReceive,
        QtyDamage: washingInfo.QtyDamage,
        Amount: washingInfo.Amount,
        UserName: washingInfo.UserName,
        WashingDate: washingInfo.WashingDate,
        ReceiveDate: washingInfo.ReceiveDate,
        Status: washingInfo.Status,
        Remark: washingInfo.Remark,
      });
    });

    const options = {
      headers: ['Lot Number', 'Washer', 'Washing Type','Issue Quantity','Receive Quantity', 'Rewash Quantity','Amount', 'User Name', 'Washing Date', 'Receive Date','Status', 'Remark'],
      nullToEmptyString: true,
    };
    new ngxCsv(report, 'Washing-List', options);
  }
  refreshDataHandler() {
    this.validateData();
    if (this.allWashingList.length || this.noWashingFound != '') {
      this.allWashingList = [];
      this.noWashingFound = "";
      this.refreshMessage = "Please click View button to get latest data";
    }
  }

  validateData() {
    if (this.washingListTask.ItemType != 0 && this.washingListTask.Supplier !=0) {
      this.buttonAction = true;
      return true;
    } else {
      this.buttonAction = false;
      return false;
    }
  }
  valueChange(txt) {
    this.allWashingList = [];
    if(txt == 'other') {
      this.searchWashingKey = '';
    }
    if(this.washingListTask.searchby == 1) {
      this.refreshMessage = 'Please search to get latest data';
    } else {
      this.refreshMessage = 'Please click View button to get latest data'
    }
  }
  getAllWashings() {
    const washingTask = JSON.parse(JSON.stringify(this.washingListTask));
    const startDate = `${washingTask.startDate.month}/${washingTask.startDate.day}/${washingTask.startDate.year}`;
    const endDate = `${washingTask.endDate.month}/${washingTask.endDate.day}/${washingTask.endDate.year}`;
    this.showLoader = true;
    this.washingService.getAllWashings(startDate,endDate,this.washingListTask.Washer,this.washingListTask.WasherType,this.userID).subscribe((res) => {
      this.showLoader = false;
      if (!res['WashingList'].length) {
        this.allWashingList = [];
        this.noWashingFound = "No Washing Found";
      } else {
        this.allWashingList = res['WashingList'];
        this.refreshMessage = "";
        this.noWashingFound = "";
        this.cacheService.set("allWashingList", this.allWashingList);
        this.cacheService.set("listWashingFilterData", this.washingListTask);
      }
    },(error) => {
      this.showLoader = false;
      this.allWashingList = [];
      this.notification.error('Error','Something went wrong, Please try later !!!');
    })
  }
  printCashData(id) {
    let table = '';
    this.washingService.getPrintableData(id,this.userID).subscribe(res=> {
      let resp = JSON.parse(JSON.stringify(res));
      this.printHeaderInfo = resp['WashingInvoice'][0];
      table = `
      <div class="row page-header">
        <div class="slip-header-section">
          <div class="slip-name">System Generated Challan</div>
          <div class="company-name">${this.printHeaderInfo.CompanyName}</div>
          <div class="addr">${this.printHeaderInfo.CompAdd}</div>
          <div class="gst-no">GST: ${this.printHeaderInfo.CompGST} </div>
        </div>
        <div class="order-section">
          <div class="order-no-lbl">Washer</div>
          <div class="order-no-value">: ${this.printHeaderInfo.Washer}</div>
          <div class="order-no-lbl">Washing Type</div>
          <div class="order-no-value">: ${this.printHeaderInfo.WashingType}</div>
          <div class="order-no-lbl">Washing Date</div>
          <div class="order-no-value">: ${this.printHeaderInfo.WashingDate}</div>
          <div class="order-no-lbl">Lot No</div>
          <div class="order-no-value">: ${this.printHeaderInfo.LotID}</div>
        </div>
        <div class="col-sm-10" style="overflow-x:auto;" id="cashContainer">
          <div>Washing Quantity: ${this.printHeaderInfo.QtyIssue}</div>
          <div>Amount: ${this.printHeaderInfo.Amount}</div>
          <div>Remark: ${this.printHeaderInfo.Remark}</div>
        </div>
        <div class="footer-text">
          <div class="extra-info">
            <div><span class="tandc">Terms&Condition</span></div>
            <div>E.& O.E.</div>
            <div>1. Stock should be returned after wash within 10 days after sample confirmation</div>
            <div>2. Final sample of each lot should be provided.</div>
          </div>
          <div class="receiver-info">
            <div class="receiver-sign">Receiver's Signature :</div>
            <div class="auth-comp-name">for ${this.printHeaderInfo.CompanyName}</div>
            <div class="auth-text">Authorised Signatory</div>
          </div>
        </div>
      </div>`;
          let newWin = window.open("");  
          newWin.document.write(`
            <html>
              <head>
                <title>Invoice</title>
                <style>
                .page-header {
                  border: 1px solid;
              }
              .slip-header-section {
                padding: 5px 0px;
                text-align: center;
              }
              .order-section {
                padding: 5px 0px;
                border-top: 1px solid;
                border-bottom: 1px solid;
              }
              .order-no-lbl {
                display: inline-block;
                width: 30%;
                padding-left: 10px;
              }
              .text-align-right {
                text-align: right;
              }
              .order-no-value {
                display: inline-block;
                width: 60%;
              }
              .Billing-section {
                display: block;
                width: 100%;
              }
              .billed-to-section {
                display: inline-block;
                width: 46%;
                border-right: 1px solid;
                padding-left: 10px 5px;
              }
              .shipping-to-section {
                padding-left: 10px 5px;
                display: inline-block;
                width: 46%;
              }
              .billed-to-detail {
                padding-left: 30px;
              }
              .shipped-to-detail {
                padding-left: 30px;
              }
              .billed-to-text {
                font-style: italic;
              }
              .shipped-to-text {
                font-style: italic;
              }
              .extra-info {
                display: inline-block;
                width: 48%;
                border-right: 1px solid;
                padding: 5px 10px;
              }
              .receiver-info {
                display: inline-block;
                width: 44%;
              }
              .receiver-sign {
                padding: 12px 0px;
              }
              .auth-comp-name {
                text-align: right;
              }
              .auth-text {
                padding-top: 3px;
                text-align: right;
              }
              .total-quantity {
                text-align: center;
                padding-right: 20px;
              }
              .footer-text {
                border-top: 1px solid;
              }
                </style>
              </head>
              <body>${table}</body>
            </html>`
              );
              newWin.print();  
              newWin.close();
    }, err=> {
      this.notification.error('Error', 'Facing Issue while print !!!');
    })
  }
  // <div>Amount: ${this.printHeaderInfo.Amount}</div>
}
