import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../shared/user.service';
import { NotificationsService } from 'angular2-notifications';
import { GenericSort } from 'app/shared/pipes/generic-sort.pipe';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CacheService } from 'app/shared/cache.service';
import { SharedService } from 'app/shared/shared.service';
import { ActivatedRoute } from '@angular/router';
import { ReturnService } from '../return.service';
import { ngxCsv } from 'ngx-csv/ngx-csv';
import { Subject } from 'rxjs';



@Component({
  selector: 'app-return-list',
  templateUrl: './return-list.component.html',
  styleUrls: ['./return-list.component.scss']
})
export class ReturnListComponent implements OnInit {
  returnTask;
  todaysDate;
  buttonAction = false;
  allReturnsList = [];
  noReturnFound = '';
  refreshMessage = "Please click View button to get latest data";
  showLoader = false;
  lookUpData;
  allVendors = [];
  allWarehouse = [];
  allReturnType = [];
  userID = '';
  printHeaderInfo;
  printDetailInfo = [];
  totalQuantity = 0;
  searchReturnKey = '';
  popupWin: any;
  searchReturnTerm$ = new Subject<string>();

  constructor(protected userService: UserService, private returnService: ReturnService,
    private sharedService: SharedService, private activatedRoute: ActivatedRoute,
    protected cacheService: CacheService, protected modalService: NgbModal,
    private notification: NotificationsService, private genericSort: GenericSort) { }

  ngOnInit() {
    const userId = localStorage.getItem('userId') || '';
    this.userID = localStorage.getItem('UserLoginId');
    this.allReturnsList = [];
    this.returnTask = this.returnService.getReturnObject();
    this.returnTask = JSON.parse(JSON.stringify(this.returnTask));
    this.returnTask.ReturnType = 1;
    this.returnTask.VendorID = 1;
    this.returnTask.WareHouseID = 1;
    this.returnTask.searchReturnby = 1;
    const now = new Date();
    this.todaysDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    this.returnTask.startDate = this.todaysDate;
    this.returnTask.endDate = this.todaysDate;
    if (this.cacheService.has("returnListFilterData")) {
      this.cacheService.get("returnListFilterData").subscribe((res) => {
        this.returnTask = JSON.parse(JSON.stringify(res));
        if(res.searchReturnby == 1) {
          this.searchReturnKey = res.searchtext;
        } else {
          this.searchReturnKey = '';
        }
        if(this.cacheService.has('allReturnsList')) {
          this.cacheService.get('allReturnsList').subscribe(res => {
            this.allReturnsList = JSON.parse(JSON.stringify(res));
          })
        }
      });
    }
    if(this.cacheService.has("backToReturnList")) {
      this.cacheService.deleteCache('backToReturnList');
      this.cacheService.get('allReturnsList').subscribe(res => {
        this.allReturnsList = JSON.parse(JSON.stringify(res));
      })
    }
    if(this.cacheService.has("redirectAfterReturnSave")) {
      this.cacheService.deleteCache('redirectAfterReturnSave');
      this.allReturnsList = [];
      if(this.returnTask.searchReturnby == 2) {
        this.validateData();
        if(this.buttonAction) {
          this.getAllReturns();
        }
      } else if(this.returnTask.searchReturnby == 1) {
        this.showLoader = true;
        this.returnService.searchListEntries(this.searchReturnKey, this.userID).subscribe(res => {
          this.showLoader = false;
          if(res['ReturnList'].length == 0) {
            this.allReturnsList = [];
            this.noReturnFound = "No Return Found";
            this.refreshMessage = '';
          } else {
            this.allReturnsList = res['ReturnList'];
            if(res['ReturnList'].length > 0) {
              this.cacheService.set("allReturnsList", this.allReturnsList);
              if(sessionStorage.getItem('searchReturnValue')) {
                this.returnTask.searchtext = sessionStorage.getItem('searchReturnValue');
              }
              this.cacheService.set("returnListFilterData", this.returnTask);
            }
          }
        }, err=> {
          this.showLoader = false;
          this.notification.error('Error', 'Having Problem in loading latest data !!!');
        })
      }
    }
    this.returnService.searchList(this.searchReturnTerm$,this.userID)
    .subscribe(results => {
      if(results['ReturnList'].length == 0) {
        this.allReturnsList = [];
        this.noReturnFound = "No Return Found";
        this.refreshMessage = '';
      } else { 
        this.allReturnsList = results['ReturnList'];
        if(results['ReturnList'].length > 0) {
          this.cacheService.set("allReturnsList", this.allReturnsList);
          if(sessionStorage.getItem('searchReturnValue')) {
            this.returnTask.searchtext = sessionStorage.getItem('searchReturnValue');
          }
          this.cacheService.set("returnListFilterData", this.returnTask);
        }
      }
    });
    this.getMasterData();
    this.validateData();
  }
  valueChange(txt) {
    this.allReturnsList = [];
    if(txt == 'other') {
      this.searchReturnKey = '';
    }
    if(this.returnTask.searchReturnby == 1) {
      this.refreshMessage = 'Please search to get latest data';
    } else {
      this.refreshMessage = 'Please click View button to get latest data'
    }
  }
  getMasterData() {
    this.showLoader = true;
    this.returnService.getMasterData(this.userID).subscribe(res => {
      this.showLoader = false;
      let lookUpData = JSON.parse(JSON.stringify(res));
      this.allVendors = lookUpData.Vendor;
      this.allWarehouse = lookUpData.Warehouse;
      this.allReturnType = lookUpData.ReturnType;
    },(error)=> {
      this.showLoader = false;
      this.notification.error('Error','Error While Lookup Master Data');
    })
  }

  refreshDataHandler() {
    this.validateData();
    if (this.allReturnsList.length || this.noReturnFound != '') {
      this.allReturnsList = [];
      this.noReturnFound = "";
      this.refreshMessage = "Please click View button to get latest data";
    }
  }

  validateData() {
    if (this.returnTask.VendorID > 0 && this.returnTask.WareHouseID > 0 && this.returnTask.ReturnType > 0) {
      this.buttonAction = true;
      return true;
    } else {
      this.buttonAction = false;
      return false;
    }
  }

  getAllReturns() {
    const returnTask = JSON.parse(JSON.stringify(this.returnTask));
    const startDate = `${returnTask.startDate.month}/${returnTask.startDate.day}/${returnTask.startDate.year}`;
    const endDate = `${returnTask.endDate.month}/${returnTask.endDate.day}/${returnTask.endDate.year}`;
    this.showLoader = true;
    this.returnService.getAllReturns(startDate,endDate,returnTask.ReturnType,returnTask.VendorID,returnTask.WareHouseID,this.userID).subscribe((res) => {
      this.showLoader = false;
      if (!res['ReturnList'].length) {
        this.allReturnsList = [];
        this.noReturnFound = "No Return Found";
      } else {
        this.allReturnsList = res['ReturnList'];
        this.refreshMessage = "";
        this.noReturnFound = "";
        this.cacheService.set("allReturnsList", this.allReturnsList);
        this.cacheService.set("returnListFilterData", this.returnTask);
      }
    },(error) => {
      this.showLoader = false;
      this.allReturnsList = [];
      this.notification.error('Error','Something went wrong, Please try later !!!');
    })
  }
  printTable() {
    var divToPrint = document.getElementById("return-table");
    let newWin = window.open("");  
    newWin.document.write(divToPrint.outerHTML);  
    newWin.print();  
    newWin.close();
  }
  exportToCSV() {
    const report = [];
    this.allReturnsList.forEach((returnInfo) => {
      report.push({
        ReturnDate: returnInfo.GoodReturnDate,
        GoodReturnNo: returnInfo.GoodReturnNo,
        Customer: returnInfo.Customer,
        ReturnType: returnInfo.ReturnType,
        Vendor: returnInfo.Vendor,
        WareHouse: returnInfo.WareHouse,
        Remark: returnInfo.RMAB_Description,
        UserName: returnInfo.UserName,
      });
    });

    const options = { 
      headers: ['Return Date','Return Number','Customer','Return Type', 'Vendor','Warehouse','Remarks', 'User Name'], 
      nullToEmptyString: true,
    };
    new ngxCsv(report, 'Return-List', options);
  }
  printReturnData(id) {
    let table = '';
    this.returnService.getPrintableData(id,this.userID).subscribe(res=> {
      console.log(res);
      let resp = JSON.parse(JSON.stringify(res));
      this.printHeaderInfo = resp['ReturnInvoice'][0];
      this.printDetailInfo = resp['ReturnInvoiceDetail'];
      table = `
      <div class="row page-header">
        <div class="slip-header-section">
          <div class="slip-name">Proforma Return Invoice</div>
          <div class="company-name">${this.printHeaderInfo.CompanyName}</div>
          <div class="addr">${this.printHeaderInfo.CompAdd}</div>
          <div class="gst-no">GST: ${this.printHeaderInfo.CompGST} </div>
        </div>
        <div class="return-section">
          <div class="return-item">
            <div class="return-no-lbl">Return No</div>
            <div class="return-no-value">: ${this.printHeaderInfo.GoodReturnNo}</div>
          </div>
          <div class="return-item">
            <div class="return-no-lbl">Receive Date</div>
            <div class="return-no-value">: ${this.printHeaderInfo.GoodReceiveDate}</div>
          </div>
          <div class="return-item">
            <div class="return-no-lbl">Customer</div>
            <div class="return-no-value">: ${this.printHeaderInfo.Customer}</div>
          </div>
          <div class="return-item">
            <div class="return-no-lbl">Return Type</div>
            <div class="return-no-value">: ${this.printHeaderInfo.ReturnType ? this.printHeaderInfo.ReturnType : 'N/A'}</div>
          </div>
          <div class="return-item">
            <div class="return-no-lbl">Vendor</div>
            <div class="return-no-value">: ${this.printHeaderInfo.Vendor ? this.printHeaderInfo.Vendor : 'N/A'}</div>
          </div>
          <div class="return-item">
            <div class="return-no-lbl">WareHouse</div>
            <div class="return-no-value">: ${this.printHeaderInfo.WareHouse ? this.printHeaderInfo.WareHouse : 'N/A'}</div>
          </div>
        </div>
        <div class="col-sm-10" style="overflow-x:auto;" id="returnContainer">
          <table cellpadding="5" border=1 style="border-collapse: collapse;" width="100%">
              <thead class="tableHeader">
                <th>SN</th>
                <th>Description of Goods</th>
                <th>Size </th>
                <th>Quantity</th>
                <th>Unit</th>
              </thead>
              <tbody>
                ${this.getTableRows(this.printDetailInfo)}
                <tr>
                  <td colspan="3" class="text-align-right"> Total Quantity</td>
                  <td class="text-align-right">${this.totalQuantity}</td>
                  <td></td>
                </tr>
              </tbody>
          </table>
        </div>
        <div class="extra-info">
          <div><span class="tandc">Terms&Condition</span></div>
          <div>E.& O.E.</div>
          <div>1. Goods once sold will not be taken back</div>
          <div>2. Interest @ 18% p.a. will be charged if the payment is not made with in the stipulated time.</div>
          <div>3. Subject to 'Gurugram' Jurisdiction only.</div>
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
            .return-section {
              display: block;
              width: 100%;
              padding: 5px 0px;
              border-top: 1px solid;
              border-bottom: 1px solid;
            }
            .return-no-lbl {
              display: inline-block;
              width: 40%;
              padding-left: 10px;
            }
            .text-align-right {
              text-align: right;
            }
            .return-no-value {
              display: inline-block;
              width: 55%;
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
            .return-item {
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
    this.totalQuantity = 0;
    for(let i=0; i< data.length; i++) {
      this.totalQuantity = this.totalQuantity + (+data[i].Quantity);
      html = html + `<tr>
        <td>${i+1}</td>
        <td>${data[i].PRODUCTCODE}</td>
        <td class="text-align-right">${data[i].Size}</td>
        <td class="text-align-right">${data[i].Quantity}</td>
        <td>${data[i].Unit}</td>
      </tr>`
    }
    return html;
  }
}
