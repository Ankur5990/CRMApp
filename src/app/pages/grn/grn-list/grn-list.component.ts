import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../shared/user.service';
import { NotificationsService } from 'angular2-notifications';
import { GenericSort } from 'app/shared/pipes/generic-sort.pipe';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CacheService } from 'app/shared/cache.service';
import { SharedService } from 'app/shared/shared.service';
import { ActivatedRoute } from '@angular/router';
import { GRNService } from '../grn.service';
import { ngxCsv } from 'ngx-csv/ngx-csv';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-grn-list',
  templateUrl: './grn-list.component.html',
  styleUrls: ['./grn-list.component.scss']
})
export class GRNListComponent implements OnInit {
  grnTask;
  todaysDate;
  buttonAction = false;
  allGrnList = [];
  noGrnFound = '';
  refreshMessage = "Please click View button to get latest data";
  showLoader = false;
  lookUpData;
  allVendors = [];
  allWarehouse = [];
  userID = '';
  printHeaderInfo;
  printDetailInfo = [];
  totalQuantity = 0
  searchKey = '';
  popupWin: any;
  searchGrnTerm$ = new Subject<string>();

  constructor(protected userService: UserService, private grnService: GRNService,
    private sharedService: SharedService, private activatedRoute: ActivatedRoute,
    protected cacheService: CacheService, protected modalService: NgbModal,
    private notification: NotificationsService, private genericSort: GenericSort) { }

  ngOnInit() {
    const userId = localStorage.getItem('userId') || '';
    this.userID = localStorage.getItem('UserLoginId');
    this.allGrnList = [];
    this.grnTask = this.grnService.getGrnObject();
    this.grnTask = JSON.parse(JSON.stringify(this.grnTask));
    this.grnTask.SourceID = 1;
    this.grnTask.VendorID = 1;
    this.grnTask.WareHouseID = 1;
    this.grnTask.searchgrnby = 1;
    const now = new Date();
    this.todaysDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    this.grnTask.startDate = this.todaysDate;
    this.grnTask.endDate = this.todaysDate;
    if (this.cacheService.has("grnListFilterData")) {
      this.cacheService.get("grnListFilterData").subscribe((res) => {
        this.grnTask = JSON.parse(JSON.stringify(res));
        if(res.searchgrnby == 1) {
          this.searchKey = res.searchtext;
        } else {
          this.searchKey = '';
        }
        if(this.cacheService.has('allGrnList')) {
          this.cacheService.get('allGrnList').subscribe(res => {
            this.allGrnList = JSON.parse(JSON.stringify(res));
          })
        }
      });
    }
    if(this.cacheService.has("backToGrnList")) {
      this.cacheService.deleteCache('backToGrnList');
      this.cacheService.get('allGrnList').subscribe(res => {
        this.allGrnList = JSON.parse(JSON.stringify(res));
      })
    }
    if(this.cacheService.has("redirectAfterGrnSave")) {
      this.cacheService.deleteCache('redirectAfterGrnSave');
      this.allGrnList = [];
      if(this.grnTask.searchgrnby == 2) {
        this.validateData();
        if(this.buttonAction) {
          this.getAllGrn();
        }
      } else if(this.grnTask.searchgrnby == 1) {
        this.showLoader = true;
        this.grnService.searchListEntries(this.searchKey, this.userID).subscribe(res => {
          this.showLoader = false;
          if(res['GRNList'].length == 0) {
            this.allGrnList = [];
            this.noGrnFound = "No Grn Found";
            this.refreshMessage = '';
          } else {
            this.allGrnList = res['GRNList'];
            if(res['GRNList'].length > 0) {
              this.cacheService.set("allGrnList", this.allGrnList);
              if(sessionStorage.getItem('searchGrnValue')) {
                this.grnTask.searchtext = sessionStorage.getItem('searchGrnValue');
              }
              this.cacheService.set("grnListFilterData", this.grnTask);
            }
          }
        }, err=> {
          this.showLoader = false;
          this.notification.error('Error', 'Having Problem in loading latest data !!!');
        })
      }
    }
    this.grnService.searchList(this.searchGrnTerm$,this.userID)
    .subscribe(results => {
      if(results['GRNList'].length == 0) {
        this.allGrnList = [];
        this.noGrnFound = "No Grn Found";
        this.refreshMessage = '';
      } else { 
        this.allGrnList = results['GRNList'];
        if(results['GRNList'].length > 0) {
          this.cacheService.set("allGrnList", this.allGrnList);
          if(sessionStorage.getItem('searchGrnValue')) {
            this.grnTask.searchtext = sessionStorage.getItem('searchGrnValue');
          }
          this.cacheService.set("grnListFilterData", this.grnTask);
        }
      }
    });
    this.getMasterData();
    this.validateData();
  }
  valueChange(txt) {
    this.allGrnList = [];
    if(txt == 'other') {
      this.searchKey = '';
    }
    if(this.grnTask.searchgrnby == 1) {
      this.refreshMessage = 'Please search to get latest data';
    } else {
      this.refreshMessage = 'Please click View button to get latest data'
    }
  }
  getMasterData() {
    this.showLoader = true;
    this.grnService.getMasterData(this.userID).subscribe(res => {
      this.showLoader = false;
      let lookUpData = JSON.parse(JSON.stringify(res));
      this.allVendors = lookUpData.Vendor;
      this.allWarehouse = lookUpData.Warehouse;
    },(error)=> {
      this.showLoader = false;
      this.notification.error('Error','Error While Lookup Master Data');
    })
  }

  refreshDataHandler() {
    this.validateData();
    if (this.allGrnList.length || this.noGrnFound != '') {
      this.allGrnList = [];
      this.noGrnFound = "";
      this.refreshMessage = "Please click View button to get latest data";
    }
  }

  validateData() {
    if (this.grnTask.VendorID > 0 && this.grnTask.WareHouseID > 0 && this.grnTask.SourceID > 0) {
      this.buttonAction = true;
      return true;
    } else {
      this.buttonAction = false;
      return false;
    }
  }

  getAllGrn() {
    const grnTask = JSON.parse(JSON.stringify(this.grnTask));
    const startDate = `${grnTask.startDate.month}/${grnTask.startDate.day}/${grnTask.startDate.year}`;
    const endDate = `${grnTask.endDate.month}/${grnTask.endDate.day}/${grnTask.endDate.year}`;
    this.showLoader = true;
    this.grnService.getAllGrn(startDate,endDate,grnTask.SourceID,grnTask.VendorID,grnTask.WareHouseID,this.userID).subscribe((res) => {
      this.showLoader = false;
      if (!res['GRNList'].length) {
        this.allGrnList = [];
        this.noGrnFound = "No GRN Found";
      } else {
        this.allGrnList = res['GRNList'];
        this.refreshMessage = "";
        this.noGrnFound = "";
        this.cacheService.set("allGrnList", this.allGrnList);
        this.cacheService.set("grnListFilterData", this.grnTask);
      }
    },(error) => {
      this.showLoader = false;
      this.allGrnList = [];
      this.notification.error('Error','Something went wrong, Please try later !!!');
    })
  }
  printTable() {
    var divToPrint = document.getElementById("grn-table");
    let newWin = window.open("");  
    newWin.document.write(divToPrint.outerHTML);  
    newWin.print();  
    newWin.close();
  }
  exportToCSV() {
    const report = [];
    this.allGrnList.forEach((grnInfo) => {
      report.push({
        GrnDate: grnInfo.GoodReceiveDate,
        GoodReceiveNo: grnInfo.GoodReceiveNo,
        LOTNumber: grnInfo.LOTNumber,
        Source: grnInfo.SourceID == 2 ? 'Lot' : 'External',
        Vendor: grnInfo.Vendor,
        WareHouse: grnInfo.WareHouse,
        IsReverse: grnInfo.IsReverse,
        Remark: grnInfo.Remark,
        UserName: grnInfo.UserName,
      });
    });

    const options = { 
      headers: ['GRN Date','GRN Number','LOT Number','Source', 'Vendor','Warehouse','Is Reverse','Remarks', 'User Name'], 
      nullToEmptyString: true,
    };
    new ngxCsv(report, 'GRN-List', options);
  }
  printGrnData(id) {
    let table = '';
    this.grnService.getPrintableData(id,this.userID).subscribe(res=> {
      console.log(res);
      let resp = JSON.parse(JSON.stringify(res));
      this.printHeaderInfo = resp['GRNInvoice'][0];
      this.printDetailInfo = resp['GRNInvoiceDetail'];
      table = `
      <div class="row page-header">
        <div class="slip-header-section">
          <div class="slip-name">Proforma GRN Invoice</div>
          <div class="company-name">${this.printHeaderInfo.CompanyName}</div>
          <div class="addr">${this.printHeaderInfo.CompAdd}</div>
          <div class="gst-no">GST: ${this.printHeaderInfo.CompGST} </div>
        </div>
        <div class="grn-section">
          <div class="grn-item">
            <div class="grn-no-lbl">GRN No</div>
            <div class="grn-no-value">: ${this.printHeaderInfo.GoodReceiveNo}</div>
          </div>
          <div class="grn-item">
            <div class="grn-no-lbl">GRN Date</div>
            <div class="grn-no-value">: ${this.printHeaderInfo.GoodReceiveDate}</div>
          </div>
          <div class="grn-item">
            <div class="grn-no-lbl">Lot No</div>
            <div class="grn-no-value">: ${this.printHeaderInfo.LOTNumber}</div>
          </div>
          <div class="grn-item">
            <div class="grn-no-lbl">Vendor</div>
            <div class="grn-no-value">: ${this.printHeaderInfo.Vendor ? this.printHeaderInfo.Vendor : 'N/A'}</div>
          </div>
          <div class="grn-item">
            <div class="grn-no-lbl">WareHouse</div>
            <div class="grn-no-value">: ${this.printHeaderInfo.WareHouse ? this.printHeaderInfo.WareHouse : 'N/A'}</div>
          </div>
        </div>
        <div class="col-sm-10" style="overflow-x:auto;" id="grnContainer">
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
            .grn-section {
              display: block;
              width: 100%;
              padding: 5px 0px;
              border-top: 1px solid;
              border-bottom: 1px solid;
            }
            .grn-no-lbl {
              display: inline-block;
              width: 40%;
              padding-left: 10px;
            }
            .text-align-right {
              text-align: right;
            }
            .grn-no-value {
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
            .grn-item {
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
