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
import { ReceiptService } from '../receipt.service';

@Component({
  selector: 'app-receipt-list',
  templateUrl: './receipt-list.component.html',
  styleUrls: ['./receipt-list.component.scss']
})
export class ReceiptListComponent implements OnInit {
  receiptListTask;
  todaysDate;
  buttonAction = false;
  allReceiptList = [];
  allReceiptType = [];
  noReceiptFound = '';
  refreshMessage = "Please click View button to get latest data";
  showLoader = false;
  lookUpData;
  userID;
  searchReceiptTerm$ = new Subject<string>();
  results;
  searchReceiptKey = '';
  printHeaderInfo;
  printDetailInfo;
  constructor(protected userService: UserService, private receiptService: ReceiptService,
    private sharedService: SharedService, private activatedRoute: ActivatedRoute,
    protected cacheService: CacheService, protected modalService: NgbModal,
    private notification: NotificationsService, private genericSort: GenericSort) { }

  ngOnInit() {
    this.userID = localStorage.getItem('UserLoginId');
    this.allReceiptList = [];
    const now = new Date();
    this.todaysDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    this.receiptListTask = this.receiptService.getReceiptObject();
    this.receiptListTask = JSON.parse(JSON.stringify(this.receiptListTask));
    this.receiptListTask.startDate = this.todaysDate;
    this.receiptListTask.endDate = this.todaysDate;
    this.receiptListTask.PartyTypeID = 1;
    this.receiptListTask.ReceiptTypeID = 1;
    this.receiptListTask.searchby = 1;
    if (this.cacheService.has("listReceiptFilterData")) {
      this.cacheService.get("listReceiptFilterData").subscribe((res) => {
        this.receiptListTask = JSON.parse(JSON.stringify(res));
        if(res.searchby == 1) {
          this.searchReceiptKey = res.searchtext;
        } else {
          this.searchReceiptKey = '';
        }
        if(this.cacheService.has('allReceiptList')) {
          this.cacheService.get('allReceiptList').subscribe(res => {
            this.allReceiptList = JSON.parse(JSON.stringify(res));
          })
        }
      });
    }
    if(this.cacheService.has("redirectToReceiptList")) {
      this.cacheService.deleteCache('redirectToReceiptList');
      this.cacheService.get('allReceiptList').subscribe(res => {
        this.allReceiptList = JSON.parse(JSON.stringify(res));
      })
    }
    if(this.cacheService.has("redirectAfterReceiptSave")) {
      this.cacheService.deleteCache('redirectAfterReceiptSave');
      this.allReceiptList = [];
      if(this.receiptListTask.searchby == 2) {
        this.validateData();
        if(this.buttonAction) {
          this.getAllReceipt();
        }
      } else if(this.receiptListTask.searchby == 1) {
        this.showLoader = true;
        this.receiptService.searchEntries(this.searchReceiptKey, this.userID).subscribe(res => {
          this.showLoader = false;
          if(res['ReceiptList'].length == 0) {
            this.allReceiptList = [];
            this.noReceiptFound = "No Receipt Found";
            this.refreshMessage = '';
          } else {
            this.allReceiptList = res['ReceiptList'];
            if(res['ReceiptList'].length > 0) {
              this.cacheService.set("allReceiptList", this.allReceiptList);
              if(sessionStorage.getItem('searchReceiptValue')) {
                this.receiptListTask.searchtext = sessionStorage.getItem('searchReceiptValue');
              }
              this.cacheService.set("listReceiptFilterData", this.receiptListTask);
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
    this.receiptService.search(this.searchReceiptTerm$,this.userID)
    .subscribe(results => {
      if(results['ReceiptList'].length == 0) {
        this.allReceiptList = [];
        this.noReceiptFound = "No Receipt Found";
        this.refreshMessage = '';
      } else {
        this.allReceiptList = results['ReceiptList'];
        if(results['ReceiptList'].length > 0) {
          this.cacheService.set("allReceiptList", this.allReceiptList);
          if(sessionStorage.getItem('searchReceiptValue')) {
            this.receiptListTask.searchtext = sessionStorage.getItem('searchReceiptValue');
          }
          this.cacheService.set("listReceiptFilterData", this.receiptListTask);
        }
      }
    });
  }

  getMasterData() {
    this.showLoader = true;
    this.receiptService.getReceiptMasterData().subscribe(res => {
      this.showLoader = false;
      let lookUpData = JSON.parse(JSON.stringify(res));
      this.allReceiptType = lookUpData.ReceiptType;
    },(error)=> {
      this.showLoader = false;
      this.notification.error('Error','Error While Lookup Receipt Master Data');
    })
  }

  printTable() {
    var divToPrint = document.getElementById("receipt-container");  
    let newWin = window.open("");  
    newWin.document.write(divToPrint.outerHTML);  
    newWin.print();  
    newWin.close();
  }
  exportToCSV() {
    const report = [];
    this.allReceiptList.forEach((receiptInfo) => {
      report.push({
        ReceiptNumber: receiptInfo.ReceiptNumber,
        PartyType: receiptInfo.PartyTypeID == 2 ? 'Customer' : 'Vendor',
        Party: receiptInfo.Party,
        ReceiptType: receiptInfo.ReceiptType,
        TransactionType: receiptInfo.TranTypeID == 2 ? 'Credit' : 'Debit',
        Amount: receiptInfo.Amount,
        UserName: receiptInfo.UserName,
        ReceiptDate: receiptInfo.ReceiptDate,
        Remark: receiptInfo.Remark,
      });
    });

    const options = {
      headers: ['Receipt Number', 'Party Type', 'Party Detail','Receipt Type', 'Transaction Type','Amount', 'User Name', 'Receipt Date','Remark'],
      nullToEmptyString: true,
    };
    new ngxCsv(report, 'Receipt-List', options);
  }
  refreshDataHandler() {
    this.validateData();
    if (this.allReceiptList.length || this.noReceiptFound != '') {
      this.allReceiptList = [];
      this.noReceiptFound = "";
      this.refreshMessage = "Please click View button to get latest data";
    }
  }

  validateData() {
    if (this.receiptListTask.PartyTypeID != 0 && this.receiptListTask.ReceiptTypeID !=0) {
      this.buttonAction = true;
      return true;
    } else {
      this.buttonAction = false;
      return false;
    }
  }
  
  valueChange(txt) {
    this.allReceiptList = [];
    if(txt == 'other') {
      this.searchReceiptKey = '';
    }
    if(this.receiptListTask.searchby == 1) {
      this.refreshMessage = 'Please search to get latest data';
    } else {
      this.refreshMessage = 'Please click View button to get latest data'
    }
  }
  getAllReceipt() {
    const receiptTask = JSON.parse(JSON.stringify(this.receiptListTask));
    const startDate = `${receiptTask.startDate.month}/${receiptTask.startDate.day}/${receiptTask.startDate.year}`;
    const endDate = `${receiptTask.endDate.month}/${receiptTask.endDate.day}/${receiptTask.endDate.year}`;
    this.showLoader = true;
    this.receiptService.getAllReceipts(startDate,endDate,this.receiptListTask.PartyTypeID,this.receiptListTask.ReceiptTypeID,this.userID).subscribe((res) => {
      this.showLoader = false;
      if (!res['ReceiptList'].length) {
        this.allReceiptList = [];
        this.noReceiptFound = "No Receipt Found";
      } else {
        this.allReceiptList = res['ReceiptList'];
        this.refreshMessage = "";
        this.noReceiptFound = "";
        this.cacheService.set("allReceiptList", this.allReceiptList);
        this.cacheService.set("listReceiptFilterData", this.receiptListTask);
      }
    },(error) => {
      this.showLoader = false;
      this.allReceiptList = [];
      this.notification.error('Error','Something went wrong, Please try later !!!');
    })
  }
  // printCashData(id) {
  //   let table = '';
  //   this.receiptService.getPrintableData(id,this.userID).subscribe(res=> {
  //     let resp = JSON.parse(JSON.stringify(res));
  //     this.printHeaderInfo = resp['WashingInvoice'][0];
  //     table = `
  //     <div class="row page-header">
  //       <div class="slip-header-section">
  //         <div class="slip-name">System Generated Challan</div>
  //         <div class="company-name">${this.printHeaderInfo.CompanyName}</div>
  //         <div class="addr">${this.printHeaderInfo.CompAdd}</div>
  //         <div class="gst-no">GST: ${this.printHeaderInfo.CompGST} </div>
  //       </div>
  //       <div class="order-section">
  //         <div class="order-no-lbl">Washer</div>
  //         <div class="order-no-value">: ${this.printHeaderInfo.Washer}</div>
  //         <div class="order-no-lbl">Washing Type</div>
  //         <div class="order-no-value">: ${this.printHeaderInfo.WashingType}</div>
  //         <div class="order-no-lbl">Washing Date</div>
  //         <div class="order-no-value">: ${this.printHeaderInfo.WashingDate}</div>
  //         <div class="order-no-lbl">Lot No</div>
  //         <div class="order-no-value">: ${this.printHeaderInfo.LotID}</div>
  //       </div>
  //       <div class="col-sm-10" style="overflow-x:auto;" id="cashContainer">
  //         <div>Washing Quantity: ${this.printHeaderInfo.QtyIssue}</div>
  //         <div>Amount: ${this.printHeaderInfo.Amount}</div>
  //         <div>Remark: ${this.printHeaderInfo.Remark}</div>
  //       </div>
  //       <div class="footer-text">
  //         <div class="extra-info">
  //           <div><span class="tandc">Terms&Condition</span></div>
  //           <div>E.& O.E.</div>
  //           <div>1. Stock should be returned after wash within 10 days after sample confirmation</div>
  //           <div>2. Final sample of each lot should be provided.</div>
  //         </div>
  //         <div class="receiver-info">
  //           <div class="receiver-sign">Receiver's Signature :</div>
  //           <div class="auth-comp-name">for ${this.printHeaderInfo.CompanyName}</div>
  //           <div class="auth-text">Authorised Signatory</div>
  //         </div>
  //       </div>
  //     </div>`;
  //         let newWin = window.open("");  
  //         newWin.document.write(`
  //           <html>
  //             <head>
  //               <title>Invoice</title>
  //               <style>
  //               .page-header {
  //                 border: 1px solid;
  //             }
  //             .slip-header-section {
  //               padding: 5px 0px;
  //               text-align: center;
  //             }
  //             .order-section {
  //               padding: 5px 0px;
  //               border-top: 1px solid;
  //               border-bottom: 1px solid;
  //             }
  //             .order-no-lbl {
  //               display: inline-block;
  //               width: 30%;
  //               padding-left: 10px;
  //             }
  //             .text-align-right {
  //               text-align: right;
  //             }
  //             .order-no-value {
  //               display: inline-block;
  //               width: 60%;
  //             }
  //             .Billing-section {
  //               display: block;
  //               width: 100%;
  //             }
  //             .billed-to-section {
  //               display: inline-block;
  //               width: 46%;
  //               border-right: 1px solid;
  //               padding-left: 10px 5px;
  //             }
  //             .shipping-to-section {
  //               padding-left: 10px 5px;
  //               display: inline-block;
  //               width: 46%;
  //             }
  //             .billed-to-detail {
  //               padding-left: 30px;
  //             }
  //             .shipped-to-detail {
  //               padding-left: 30px;
  //             }
  //             .billed-to-text {
  //               font-style: italic;
  //             }
  //             .shipped-to-text {
  //               font-style: italic;
  //             }
  //             .extra-info {
  //               display: inline-block;
  //               width: 48%;
  //               border-right: 1px solid;
  //               padding: 5px 10px;
  //             }
  //             .receiver-info {
  //               display: inline-block;
  //               width: 44%;
  //             }
  //             .receiver-sign {
  //               padding: 12px 0px;
  //             }
  //             .auth-comp-name {
  //               text-align: right;
  //             }
  //             .auth-text {
  //               padding-top: 3px;
  //               text-align: right;
  //             }
  //             .total-quantity {
  //               text-align: center;
  //               padding-right: 20px;
  //             }
  //             .footer-text {
  //               border-top: 1px solid;
  //             }
  //               </style>
  //             </head>
  //             <body>${table}</body>
  //           </html>`
  //             );
  //             newWin.print();  
  //             newWin.close();
  //   }, err=> {
  //     this.notification.error('Error', 'Facing Issue while print !!!');
  //   })
  // }
  // <div>Amount: ${this.printHeaderInfo.Amount}</div>
}
