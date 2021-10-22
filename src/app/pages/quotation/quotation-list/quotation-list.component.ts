import { Component, OnInit } from '@angular/core';
import { ngxCsv } from 'ngx-csv/ngx-csv';
import { Subject } from 'rxjs';
import { NotificationsService } from 'angular2-notifications';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { UserService } from '../../../shared/user.service';
import { GenericSort } from 'app/shared/pipes/generic-sort.pipe';
import { CacheService } from 'app/shared/cache.service';
import { QuotationService } from '../quotation.service';


@Component({
  selector: 'app-quotation-list',
  templateUrl: './quotation-list.component.html',
  styleUrls: ['./quotation-list.component.scss']
})
export class QuotationListComponent implements OnInit {
  quotationTask;
  todaysDate;
  buttonAction = false;
  allQuotationsList = [];
  allWareHouse = [];
  noQuotationFound = '';
  refreshMessage = "Please click View button to get latest data";
  showLoader = false;
  lookUpData;
  userID = '';
  printHeaderInfo;
  printDetailInfo = [];
  searchKey = '';
  popupWin: any;
  searchQuotationsTerm$ = new Subject<string>();

  constructor(protected userService: UserService, private quotationService: QuotationService,
    protected cacheService: CacheService, protected modalService: NgbModal,
    private notification: NotificationsService, private genericSort: GenericSort) { }

  ngOnInit() {
    const userId = localStorage.getItem('userId') || '';
    this.userID = localStorage.getItem('UserLoginId');
    this.allQuotationsList = [];
    this.quotationTask = this.quotationService.getQuotationObject();
    this.quotationTask = JSON.parse(JSON.stringify(this.quotationTask));
    this.quotationTask.QuotationType = 1;
    this.quotationTask.WareHouseID = 1;
    this.quotationTask.searchquotationby = 1;
    const now = new Date();
    this.todaysDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    this.quotationTask.startDate = this.todaysDate;
    this.quotationTask.endDate = this.todaysDate;
    if (this.cacheService.has("quotationListFilterData")) {
      this.cacheService.get("quotationListFilterData").subscribe((res) => {
        this.quotationTask = JSON.parse(JSON.stringify(res));
        if(res.searchquotationby == 1) {
          this.searchKey = res.searchtext;
        } else {
          this.searchKey = '';
        }
        if(this.cacheService.has('allQuotationsList')) {
          this.cacheService.get('allQuotationsList').subscribe(res => {
            this.allQuotationsList = JSON.parse(JSON.stringify(res));
          })
        }
      });
    }
    if(this.cacheService.has("backToQuotationList")) {
      this.cacheService.deleteCache('backToQuotationList');
      this.cacheService.get('allQuotationsList').subscribe(res => {
        this.allQuotationsList = JSON.parse(JSON.stringify(res));
      })
    }
    if(this.cacheService.has("redirectAfterQuotationSave")) {
      this.cacheService.deleteCache('redirectAfterQuotationSave');
      this.allQuotationsList = [];
      if(this.quotationTask.searchquotationby == 2) {
        this.validateData();
        if(this.buttonAction) {
          this.getAllQuotations();
        }
      } else if(this.quotationTask.searchquotationby == 1) {
        this.showLoader = true;
        this.quotationService.searchListEntries(this.searchKey, this.userID).subscribe(res => {
          this.showLoader = false;
          if(res['QuotaionList'].length == 0) {
            this.allQuotationsList = [];
            this.noQuotationFound = "No Quotation Found";
            this.refreshMessage = '';
          } else {
            this.allQuotationsList = res['QuotaionList'];
            if(res['QuotaionList'].length > 0) {
              this.cacheService.set("allQuotationsList", this.allQuotationsList);
              if(sessionStorage.getItem('searchQuotationValue')) {
                this.quotationTask.searchtext = sessionStorage.getItem('searchQuotationValue');
              }
              this.cacheService.set("quotationListFilterData", this.quotationTask);
            }
          }
        }, err=> {
          this.showLoader = false;
          this.notification.error('Error', 'Having Problem in loading latest data !!!');
        })
      }
    }
    this.quotationService.searchList(this.searchQuotationsTerm$,this.userID)
    .subscribe(results => {
      if(results['QuotationList'].length == 0) {
        this.allQuotationsList = [];
        this.noQuotationFound = "No Quotation Found";
        this.refreshMessage = '';
      } else {
        this.allQuotationsList = results['QuotationList'];
        if(results['QuotationList'].length > 0) {
          this.cacheService.set("allQuotationsList", this.allQuotationsList);
          if(sessionStorage.getItem('searchQuotationValue')) {
            this.quotationTask.searchtext = sessionStorage.getItem('searchQuotationValue');
          }
          this.cacheService.set("quotationListFilterData", this.quotationTask);
        }
      }
    });
    this.getImsMasterData();
    this.validateData();
  }
  valueChange(txt) {
    this.allQuotationsList = [];
    if(txt == 'other') {
      this.searchKey = '';
    }
    if(this.quotationTask.searchquotationby == 1) {
      this.refreshMessage = 'Please search to get latest data';
    } else {
      this.refreshMessage = 'Please click View button to get latest data'
    }
  }

  getImsMasterData() {
    this.showLoader = true;
    this.quotationService.getImsMasterData(this.userID).subscribe(resp =>{
      this.showLoader = false;
      let imsMasterData = JSON.parse(JSON.stringify(resp));
      this.allWareHouse = imsMasterData.Warehouse;
    }, error => {
      this.showLoader = false;
      this.notification.error('Error', 'Error while IMS master data');
    })
  }
  refreshDataHandler() {
    this.validateData();
    if (this.allQuotationsList.length || this.noQuotationFound != '') {
      this.allQuotationsList = [];
      this.noQuotationFound = "";
      this.refreshMessage = "Please click View button to get latest data";
    }
  }

  validateData() {
    if (this.quotationTask.QuotationType != '' && this.quotationTask.WareHouseID > 0) {
      this.buttonAction = true;
      return true;
    } else {
      this.buttonAction = false;
      return false;
    }
  }

  getAllQuotations() {
    const quotationTask = JSON.parse(JSON.stringify(this.quotationTask));
    const startDate = `${quotationTask.startDate.month}/${quotationTask.startDate.day}/${quotationTask.startDate.year}`;
    const endDate = `${quotationTask.endDate.month}/${quotationTask.endDate.day}/${quotationTask.endDate.year}`;
    this.showLoader = true;
    this.quotationService.getAllQuotation(startDate,endDate,quotationTask.QuotationType,quotationTask.WareHouseID,this.userID).subscribe((res) => {
      this.showLoader = false;
      if (!res['QuotationList'].length) {
        this.allQuotationsList = [];
        this.noQuotationFound = "No Quotation Found";
      } else {
        this.allQuotationsList = res['QuotationList'];
        this.refreshMessage = "";
        this.noQuotationFound = "";
        this.cacheService.set("allQuotationsList", this.allQuotationsList);
        this.cacheService.set("quotationListFilterData", this.quotationTask);
      }
    },(error) => {
      this.showLoader = false;
      this.allQuotationsList = [];
      this.notification.error('Error','Something went wrong, Please try later !!!');
    })
  }
  printTable() {
    var divToPrint = document.getElementById("quotation-table");
    let newWin = window.open("");  
    newWin.document.write(divToPrint.outerHTML);  
    newWin.print();  
    newWin.close();
  }
  exportToCSV() {
    const report = [];
    this.allQuotationsList.forEach((quotationInfo) => {
      report.push({
        QuotationDate: quotationInfo.QuotationDate,
        LeadNumber: quotationInfo.LeadNumber,
        QuotationNumber: quotationInfo.QuotationNumber,
        QuotationType: quotationInfo.QuotationType,
        CustomerName: quotationInfo.CustomerName,
        Warehouse: quotationInfo.Warehouse,
        Quantity: quotationInfo.Quantity,
        DiscountPercentage: quotationInfo.DiscountPercentage,
        FreightAmount: quotationInfo.FreightAmount,
        TotalAmount: quotationInfo.TotalAmount,
        PhoneNo: quotationInfo.PhoneNo,
        Remark: quotationInfo.Remarks
      });
    });

    const options = { 
      headers: ['Quotation Date','Lead Number','Quotation Number','Quotation Type', 'Customer Name','Warehouse', 'Quantity','Discount(%)','Pic-up Amount','Total Amount','Phone No','Remarks'], 
      nullToEmptyString: true,
    };
    new ngxCsv(report, 'quotation-List', options);
  }
  printCashData(id) {
    let table = '';
    this.quotationService.getPrintableData(id,this.userID).subscribe(res=> {
      let resp = JSON.parse(JSON.stringify(res));
      this.printHeaderInfo = resp['Header'][0];
      this.printDetailInfo = resp['Detail'];
      table = `
      <div class="row page-header">
        <div class="slip-header-section">
          <div class="slip-name">Proforma Invoice</div>
          <div class="company-name">${this.printHeaderInfo.CompanyName}</div>
          <div class="addr">${this.printHeaderInfo.CompAdd}</div>
          <div class="gst-no">GST: ${this.printHeaderInfo.CompGST} </div>
        </div>
        <div class="quotation-section">
          <div class="quotation-item">
            <div class="quotation-no-lbl">Quotation No</div>
            <div class="quotation-no-value">: ${this.printHeaderInfo.QuotationNumber}</div>
          </div>
          <div class="quotation-item">
            <div class="quotation-no-lbl">Quotation Date</div>
            <div class="quotation-no-value">: ${this.printHeaderInfo.OrderDate}</div>
          </div>
          <div class="quotation-item">
            <div class="quotation-no-lbl">Warehouse</div>
            <div class="quotation-no-value">: ${this.printHeaderInfo.Warehouse ? this.printHeaderInfo.Warehouse : 'N/A'}</div>
          </div>
          <div class="quotation-item">
            <div class="quotation-no-lbl">Lead Type</div>
            <div class="quotation-no-value">: ${this.printHeaderInfo.LeadType ? this.printHeaderInfo.LeadType : 'N/A'}</div>
          </div>
        </div>
        <div class="Billing-section">
          <div class="billed-to-text">Billed to:</div>
          <div class="shipped-to-text">Shipped to:</div>
          <div class="billed-to-section">
            <div class="billed-to-detail">
              <div class="cust-name">${this.printHeaderInfo.BillingAddress ? this.printHeaderInfo.BillingAddress : this.printHeaderInfo.CustomerName}</div>
              <div class="cust-add">${this.printHeaderInfo.BillingAddress ? '.' : this.printHeaderInfo.Address}</div>
            </div>
          </div>
          <div class="shipping-to-section">
            <div class="shipped-to-detail">
              <div class="cust-name">${this.printHeaderInfo.CustomerName}</div>
              <div class="cust-add">${this.printHeaderInfo.Address}</div>
            </div>
          </div>
        </div>
              <div class="col-sm-10" style="overflow-x:auto;" id="cashContainer">
                  <table cellpadding="5" border=1 style="border-collapse: collapse;" width="100%">
                      <thead class="tableHeader">
                        ${this.getHeaderData()}
                      </thead>
                      <tbody>
                        ${this.getTableRows(this.printDetailInfo)}
                        ${this.getOtherRows()}
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
              .quotation-section {
                display: block;
                width: 100%;
                padding: 5px 0px;
                border-top: 1px solid;
                border-bottom: 1px solid;
              }
              .quotation-no-lbl {
                display: inline-block;
                width: 40%;
                padding-left: 10px;
              }
              .text-align-right {
                text-align: right;
              }
              .quotation-no-value {
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
              .quotation-item {
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
        <td>${data[i].PRODUCTCODE}</td>`;
      html = html +`<td class="text-align-right">${data[i].Quantity}</td>
        <td>${data[i].Unit}</td>
        <td class="text-align-right">${data[i].Price}</td>
        <td class="text-align-right">${data[i].Amount}</td>
      </tr>`;
    }
    return html;
  }
  getHeaderData() {
    let html ='';
    html = html + `
      <th>SN</th>
      <th>Description of Goods</th>`;
    html = html + ` <th>Quantity</th>
      <th>Unit</th>
      <th>Price</th>
      <th>Amount</th>`;
    return html;
  }
  getOtherRows() {
    return `
    <tr>
      <td colspan="5"></td>
      <td class="text-align-right">${this.printHeaderInfo.SubTotalAmount}</td>
    </tr>
    <tr>
      <td colspan="5" class="text-align-right">Pic-up Charges</td>
      <td class="text-align-right">${this.printHeaderInfo.FreightAmount}</td>
    </tr>
    <tr>
      <td colspan="5" class="text-align-right">Discount</td>
      <td class="text-align-right">${this.printHeaderInfo.DiscountAmount}</td>
    </tr>
    <tr>
      <td colspan="2" class="text-align-right">Grand Total</td>
      <td colspan="3" class="total-quantity">${this.printHeaderInfo.TotalQuantity}</td>
      <td class="text-align-right">${this.printHeaderInfo.TotalAmount}</td>
    </tr>
    <tr>
      <td colspan="6"><b>${this.printHeaderInfo.TotalAmountWords}</b></td>
    </tr>
    `
  }
}
