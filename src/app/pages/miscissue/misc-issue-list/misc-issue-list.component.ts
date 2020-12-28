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
import { MiscIssueService } from '../misc-issue.service';

@Component({
  selector: 'app-misc-issue-list',
  templateUrl: './misc-issue-list.component.html',
  styleUrls: ['./misc-issue-list.component.scss']
})
export class MiscIssueListComponent implements OnInit {
  issueListTask;
  todaysDate;
  buttonAction = false;
  allIssueList = [];
  allVendor = [];
  noIssueFound = '';
  refreshMessage = "Please click View button to get latest data";
  showLoader = false;
  userID;
  searchIssueTerm$ = new Subject<string>();
  searchIssueKey = '';
  printHeaderInfo;
  printDetailInfo;
  constructor(protected userService: UserService, private issueService: MiscIssueService,
    private sharedService: SharedService, protected cacheService: CacheService, protected modalService: NgbModal,
    private notification: NotificationsService, private genericSort: GenericSort) { }

  ngOnInit() {
    this.userID = localStorage.getItem('UserLoginId');
    this.allIssueList = [];
    this.issueListTask = this.issueService.getIssueObject();
    this.issueListTask = JSON.parse(JSON.stringify(this.issueListTask));
    this.issueListTask.IssueType = 0;
    this.issueListTask.Vendor = 1;
    this.issueListTask.searchThrough = 1;
    const now = new Date();
    this.todaysDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    this.issueListTask.startDate = this.todaysDate;
    this.issueListTask.endDate = this.todaysDate;
    if (this.cacheService.has("listIssueFilterData")) {
      this.cacheService.get("listIssueFilterData").subscribe((res) => {
        this.issueListTask = JSON.parse(JSON.stringify(res));
        if(res.searchThrough == 1) {
          this.searchIssueKey = res.searchtext;
        } else {
          this.searchIssueKey = '';
        }
        if(this.cacheService.has('allIssueList')) {
          this.cacheService.get('allIssueList').subscribe(res => {
            this.allIssueList = JSON.parse(JSON.stringify(res));
          })
        }
      });
    }
    if(this.cacheService.has("redirectToIssueList")) {
      this.cacheService.deleteCache('redirectToIssueList');
      this.cacheService.get('allIssueList').subscribe(res => {
        this.allIssueList = JSON.parse(JSON.stringify(res));
      })
    }
    if(this.cacheService.has("redirectAfterIssueSave")) {
      this.cacheService.deleteCache('redirectAfterIssueSave');
      this.allIssueList = [];
      if(this.issueListTask.searchThrough == 2) {
        // this.validateData();
        // if(this.buttonAction) {
          this.getAllMiscIssue();
        // }
      } else if(this.issueListTask.searchThrough == 1) {
        this.showLoader = true;
        this.issueService.searchEntries(this.searchIssueKey, this.userID).subscribe(res => {
          this.showLoader = false;
          if(res['MiscIssueList'].length == 0) {
            this.allIssueList = [];
            this.noIssueFound = "No Issue Found";
            this.refreshMessage = '';
          } else {
            this.allIssueList = res['MiscIssueList'];
            if(res['MiscIssueList'].length > 0) {
              this.cacheService.set("allIssueList", this.allIssueList);
              if(sessionStorage.getItem('searchIssueValue')) {
                this.issueListTask.searchtext = sessionStorage.getItem('searchIssueValue');
              }
              this.cacheService.set("listIssueFilterData", this.issueListTask);
            }
          }
        }, err=> {
          this.showLoader = false;
          this.notification.error('Error', 'Having Problem in loading latest data !!!');
        })
      }
    }
    this.getMasterData();                    
    //this.validateData();
    this.issueService.search(this.searchIssueTerm$,this.userID)
    .subscribe(results => {
      if(results['MiscIssueList'].length == 0) {
        this.allIssueList = [];
        this.noIssueFound = "No Issue Found";
        this.refreshMessage = '';
      } else {
        this.allIssueList = results['MiscIssueList'];
        if(results['MiscIssueList'].length > 0) {
          this.cacheService.set("allIssueList", this.allIssueList);
          if(sessionStorage.getItem('searchIssueValue')) {
            this.issueListTask.searchtext = sessionStorage.getItem('searchIssueValue');
          }
          this.cacheService.set("listIssueFilterData", this.issueListTask);
        }
      }
    });
  }

  getMasterData() {
    this.showLoader = true;
    this.issueService.getMasterData(this.userID).subscribe(res => {
      this.showLoader = false;
      let lookUpData = JSON.parse(JSON.stringify(res));
      this.allVendor = lookUpData.Vendor;
    },(error)=> {
      this.showLoader = false;
      this.notification.error('Error','Error While Lookup Master Data');
    })
  }

  printTable() {
    var divToPrint = document.getElementById("issue-container");  
    let newWin = window.open("");  
    newWin.document.write(divToPrint.outerHTML);  
    newWin.print();  
    newWin.close();
  }
  exportToCSV() {
    const report = [];
    this.allIssueList.forEach((issueInfo) => {
      report.push({
        MiscIssueNo: issueInfo.MiscIssueNo,
        LotNo: issueInfo.LOTID,
        PONumber: issueInfo.PONumber,
        IssueType: issueInfo.IssueTypeID == 1? 'Lot': 'Purchase',
        Vendor: issueInfo.Vendor,
        Remark: issueInfo.Remark,
        IsReturn: issueInfo.IsReturn,
        MiscIssueDate: issueInfo.MiscIssueDate,
        ReceiveDate: issueInfo.ReceiveDate,
        UserName: issueInfo.UserName,
      });
    });

    const options = { 
      headers: ['Misc Issue No', 'Lot No', 'PO Number', 'Issue Type', 'Vendor', 'Remark', 'Is Return', 'Misc Issue Date', 'Receive Date', 'User Name'], 
      nullToEmptyString: true,
    };
    new ngxCsv(report, 'MiscIssue-List', options);
  }
  refreshDataHandler() {
    if (this.allIssueList.length || this.noIssueFound != '') {
      this.allIssueList = [];
      this.noIssueFound = "";
      this.refreshMessage = "Please click View button to get latest data";
    }
  }

  // validateData() {
  //   if ( this.issueListTask.Supplier !=0) {
  //     this.buttonAction = true;
  //     return true;
  //   } else {
  //     this.buttonAction = false;
  //     return false;
  //   }
  // }
  valueChange(txt) {
    this.allIssueList = [];
    if(txt == 'other') {
      this.searchIssueKey = '';
    }
    if(this.issueListTask.searchThrough == 1) {
      this.refreshMessage = 'Please search to get latest data';
    } else {
      this.refreshMessage = 'Please click View button to get latest data'
    }
  }
  getAllMiscIssue() {
    const issueTask = JSON.parse(JSON.stringify(this.issueListTask));
    const startDate = `${issueTask.startDate.month}/${issueTask.startDate.day}/${issueTask.startDate.year}`;
    const endDate = `${issueTask.endDate.month}/${issueTask.endDate.day}/${issueTask.endDate.year}`;
    this.showLoader = true;
    this.issueService.getAllMiscIssue(startDate,endDate,issueTask.IssueType,issueTask.Vendor, this.userID).subscribe((res) => {
      this.showLoader = false;
      if (!res['MiscIssueList'].length) {
        this.allIssueList = [];
        this.noIssueFound = "No Issue Found";
      } else {
        this.allIssueList = res['MiscIssueList'];
        this.refreshMessage = "";
        this.noIssueFound = "";
        this.cacheService.set("allIssueList", this.allIssueList);
        this.cacheService.set("listIssueFilterData", this.issueListTask);
      }
    },(error) => {
      this.showLoader = false;
      this.allIssueList = [];
      this.notification.error('Error','Something went wrong, Please try later !!!');
    })
  }
  printCashData(id) {
    let table = '';
    this.issueService.getPrintableData(id,this.userID).subscribe(res=> {
      let resp = JSON.parse(JSON.stringify(res));
      this.printHeaderInfo = resp['MiscIssueInvoice'][0];
      this.printDetailInfo = resp['MiscIssueInvoiceDetail'];
      table = `
      <div class="row page-header">
        <div class="slip-header-section">
          <div class="slip-name">Challan</div>
          <div class="company-name">${this.printHeaderInfo.CompanyName}</div>
          <div class="addr">${this.printHeaderInfo.CompAdd}</div>
          <div class="gst-no">GST: ${this.printHeaderInfo.CompGST} </div>
        </div>
        <div class="order-section">
          <div class="order-item">
            <div class="order-no-lbl">Misc Issue No</div>
            <div class="order-no-value">: ${this.printHeaderInfo.MiscIssueNo}</div>
          </div>
          <div class="order-item">
            <div class="order-no-lbl">Misc Issue type</div>
            <div class="order-no-value">: ${this.printHeaderInfo.IssueTypeID == 1 ? 'Lot' : 'Purchase'}</div>
          </div>
          <div class="order-item">
            <div class="order-no-lbl">Lot No</div>
            <div class="order-no-value">: ${this.printHeaderInfo.LotID ? this.printHeaderInfo.LotID : 'N/A'}</div>
          </div>
          <div class="order-item">
            <div class="order-no-lbl">PO Number</div>
            <div class="order-no-value">: ${this.printHeaderInfo.PONumber ? this.printHeaderInfo.PONumber : 'N/A'}</div>
          </div>
          <div class="order-item">
            <div class="order-no-lbl">Vendor</div>
            <div class="order-no-value">: ${this.printHeaderInfo.Vendor ? this.printHeaderInfo.Vendor : 'N/A'}</div>
          </div>
          <div class="order-item">
            <div class="order-no-lbl">Challan Type</div>
            <div class="order-no-value">: ${this.printHeaderInfo.ChallanType ? this.printHeaderInfo.ChallanType : 'N/A'}</div>
          </div>
          <div class="order-item">
            <div class="order-no-lbl">Misc Issue Date</div>
            <div class="order-no-value">: ${this.printHeaderInfo.MiscIssueDate ? this.printHeaderInfo.MiscIssueDate : 'N/A'}</div>
          </div>
          <div class="order-item">
            <div class="order-no-lbl">Receive Date</div>
            <div class="order-no-value">: ${this.printHeaderInfo.ReceiveDate ? this.printHeaderInfo.ReceiveDate : 'N/A'}</div>
          </div>
          <div class="order-item">
            <div class="order-no-lbl">Remark</div>
            <div class="order-no-value">: ${this.printHeaderInfo.Remark ? this.printHeaderInfo.Remark : 'N/A'}</div>
          </div>
          <div class="order-item">
            <div class="order-no-lbl">Total Amount</div>
            <div class="order-no-value">: ${this.printHeaderInfo.TotalAmount ? this.printHeaderInfo.TotalAmount : 'N/A'}</div>
          </div>
        </div>
        <div class="col-sm-10" style="overflow-x:auto;" id="cashContainer">
          <table cellpadding="5" border=1 style="border-collapse: collapse;" width="100%">
            <thead class="tableHeader">
              <th>SN</th>
              <th>Item Name</th>
              <th>Issue Quantity</th>
              <th>Unit</th>
              <th>Rate</th>
              <th>Amount</th>
            </thead>
            <tbody>
              ${this.getTableRows(this.printDetailInfo)}
            </tbody>
          </table>
        </div>
        <div class="extra-info">
          <div><span class="tandc">Terms&Condition</span></div>
          <div>E.& O.E.</div>
          <div>1. Please receive the following goods.</div>
          <div>2. Received the above goods in good condition & order</div>
        </div>
        <div class="receiver-info">
          <div class="receiver-sign">Receiver's Signature :</div>
          <div class="auth-comp-name">for ${this.printHeaderInfo.CompanyName}</div>
          <div class="auth-text">Authorised Signatory</div>
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
            display: block;
            width: 100%;
            padding: 5px 0px;
            border-top: 1px solid;
            border-bottom: 1px solid;
          }
          .order-no-lbl {
            display: inline-block;
            width: 40%;
            padding-left: 10px;
          }
          .text-align-right {
            text-align: right;
          }
          .order-no-value {
            display: inline-block;
            width: 55%;
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
            display: inline-block;
            width: 45%;
          }
          .shipped-to-text {
            font-style: italic;
            display: inline-block;
            width: 45%;
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
          .order-item {
            display: inline-block;
            width: 45%;
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
  getTableRows(data) {
    let html = '';
    for(let i=0; i< data.length; i++) {
      html = html + `<tr>
        <td>${i+1}</td>
        <td>${data[i].ItemName}</td>
        <td class="text-align-right">${data[i].IssueQuantity}</td>
        <td>${data[i].Unit}</td>
        <td class="text-align-right">${data[i].Rate}</td>
        <td class="text-align-right">${data[i].Amount}</td>
      </tr>`
    }
    return html;
  }
}
