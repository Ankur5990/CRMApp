import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../shared/user.service';
import { NotificationsService } from 'angular2-notifications';
import { GenericSort } from 'app/shared/pipes/generic-sort.pipe';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CacheService } from 'app/shared/cache.service';
import { SharedService } from 'app/shared/shared.service';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../orders.service';
import { ngxCsv } from 'ngx-csv/ngx-csv';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-orders-list',
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.scss']
})
export class OrdersListComponent implements OnInit {
  orderTask;
  todaysDate;
  buttonAction = false;
  allOrdersList = [];
  noOrderFound = '';
  refreshMessage = "Please click View button to get latest data";
  showLoader = false;
  lookUpData;
  allOrderStatus = [];
  userID = '';
  printHeaderInfo;
  printDetailInfo = [];
  searchKey = '';
  popupWin: any;
  searchOrdersTerm$ = new Subject<string>();

  constructor(protected userService: UserService, private orderService: OrderService,
    private sharedService: SharedService, private activatedRoute: ActivatedRoute,
    protected cacheService: CacheService, protected modalService: NgbModal,
    private notification: NotificationsService, private genericSort: GenericSort) { }

  ngOnInit() {
    const userId = localStorage.getItem('userId') || '';
    this.userID = localStorage.getItem('UserLoginId');
    this.allOrdersList = [];
    this.orderTask = this.orderService.getOrdersObject();
    this.orderTask = JSON.parse(JSON.stringify(this.orderTask));
    this.orderTask.OrderType = 1;
    this.orderTask.OrderStatus = 1;
    this.orderTask.searchorderby = 1;
    const now = new Date();
    this.todaysDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    this.orderTask.startDate = this.todaysDate;
    this.orderTask.endDate = this.todaysDate;
    if (this.cacheService.has("orderListFilterData")) {
      this.cacheService.get("orderListFilterData").subscribe((res) => {
        this.orderTask = JSON.parse(JSON.stringify(res));
        if(res.searchorderby == 1) {
          this.searchKey = res.searchtext;
        } else {
          this.searchKey = '';
        }
        if(this.cacheService.has('allOrdersList')) {
          this.cacheService.get('allOrdersList').subscribe(res => {
            this.allOrdersList = JSON.parse(JSON.stringify(res));
          })
        }
      });
    }
    if(this.cacheService.has("backToOrderList")) {
      this.cacheService.deleteCache('backToOrderList');
      this.cacheService.get('allOrdersList').subscribe(res => {
        this.allOrdersList = JSON.parse(JSON.stringify(res));
      })
    }
    if(this.cacheService.has("redirectAfterOrderSave")) {
      this.cacheService.deleteCache('redirectAfterOrderSave');
      this.allOrdersList = [];
      if(this.orderTask.searchorderby == 2) {
        this.validateData();
        if(this.buttonAction) {
          this.getAllOrders();
        }
      } else if(this.orderTask.searchorderby == 1) {
        this.showLoader = true;
        this.orderService.searchListEntries(this.searchKey, this.userID).subscribe(res => {
          this.showLoader = false;
          if(res['OrderList'].length == 0) {
            this.allOrdersList = [];
            this.noOrderFound = "No Lead Found";
            this.refreshMessage = '';
          } else {
            this.allOrdersList = res['OrderList'];
            if(res['OrderList'].length > 0) {
              this.cacheService.set("allOrdersList", this.allOrdersList);
              if(sessionStorage.getItem('searchOrderValue')) {
                this.orderTask.searchtext = sessionStorage.getItem('searchOrderValue');
              }
              this.cacheService.set("orderListFilterData", this.orderTask);
            }
          }
        }, err=> {
          this.showLoader = false;
          this.notification.error('Error', 'Having Problem in loading latest data !!!');
        })
      }
    }
    this.orderService.searchList(this.searchOrdersTerm$,this.userID)
    .subscribe(results => {
      if(results['OrderList'].length == 0) {
        this.allOrdersList = [];
        this.noOrderFound = "No Lead Found";
        this.refreshMessage = '';
      } else {
        this.allOrdersList = results['OrderList'];
        if(results['OrderList'].length > 0) {
          this.cacheService.set("allOrdersList", this.allOrdersList);
          if(sessionStorage.getItem('searchOrderValue')) {
            this.orderTask.searchtext = sessionStorage.getItem('searchOrderValue');
          }
          this.cacheService.set("orderListFilterData", this.orderTask);
        }
      }
    });
    this.getMasterData();
    this.validateData();
  }
  valueChange(txt) {
    this.allOrdersList = [];
    if(txt == 'other') {
      this.searchKey = '';
    }
    if(this.orderTask.searchorderby == 1) {
      this.refreshMessage = 'Please search to get latest data';
    } else {
      this.refreshMessage = 'Please click View button to get latest data'
    }
  }
  getMasterData() {
    this.showLoader = true;
    this.orderService.getMasterData().subscribe(res => {
      this.showLoader = false;
      let lookUpData = JSON.parse(JSON.stringify(res));
      this.allOrderStatus = lookUpData.OrderStatus;
    },(error)=> {
      this.showLoader = false;
      this.notification.error('Error','Error While Lookup Master Data');
    })
  }

  refreshDataHandler() {
    this.validateData();
    if (this.allOrdersList.length || this.noOrderFound != '') {
      this.allOrdersList = [];
      this.noOrderFound = "";
      this.refreshMessage = "Please click View button to get latest data";
    }
  }

  validateData() {
    if (this.orderTask.OrderType != '' && this.orderTask.OrderStatus !=0) {
      this.buttonAction = true;
      return true;
    } else {
      this.buttonAction = false;
      return false;
    }
  }

  getAllOrders() {
    const orderTask = JSON.parse(JSON.stringify(this.orderTask));
    const startDate = `${orderTask.startDate.month}/${orderTask.startDate.day}/${orderTask.startDate.year}`;
    const endDate = `${orderTask.endDate.month}/${orderTask.endDate.day}/${orderTask.endDate.year}`;
    this.showLoader = true;
    this.orderService.getAllOrders(startDate,endDate,orderTask.OrderType,orderTask.OrderStatus,this.userID).subscribe((res) => {
      this.showLoader = false;
      if (!res['OrderList'].length) {
        this.allOrdersList = [];
        this.noOrderFound = "No Order Found";
      } else {
        this.allOrdersList = res['OrderList'];
        this.refreshMessage = "";
        this.noOrderFound = "";
        this.cacheService.set("allOrdersList", this.allOrdersList);
        this.cacheService.set("orderListFilterData", this.orderTask);
      }
    },(error) => {
      this.showLoader = false;
      this.allOrdersList = [];
      this.notification.error('Error','Something went wrong, Please try later !!!');
    })
  }
  printTable() {
    var divToPrint = document.getElementById("order-table");
    let newWin = window.open("");  
    newWin.document.write(divToPrint.outerHTML);  
    newWin.print();  
    newWin.close();
  }
  exportToCSV() {
    const report = [];
    this.allOrdersList.forEach((orderInfo) => {
      report.push({
        OrderDate: orderInfo.OrderDate,
        LeadNumber: orderInfo.LeadNumber,
        OrderNumber: orderInfo.OrderNumber,
        OrderType: orderInfo.OrderType,
        CustomerName: orderInfo.CustomerName,
        TotalAmount: orderInfo.TotalAmount,
        DiscountPercentage: orderInfo.DiscountPercentage,
        FreightAmount: orderInfo.FreightAmount,
        PaymentMode: orderInfo.PaymentMode,
        Transporter: orderInfo.Transporter,
        DispatchNo: orderInfo.DispatchNo,
        InvoiceNumber: orderInfo.InvoiceNumber,
        Quantity: orderInfo.Quantity,
        PhoneNo: orderInfo.PhoneNo,
        Cash: orderInfo.CashAmount,
        Cheque: orderInfo.CheckAmount,
        Other: orderInfo.OtherAmount,
        OrderStatus: orderInfo.OrderStatus,
        Remark: orderInfo.Remarks
      });
    });

    const options = { 
      headers: ['Order Date','Lead Number','Order Number','Order Type', 'Customer Name','Total Amount','Discount(%)','Freight Amount', 'Payment Mode', 'Transporter', 'Dispatch No', 'Invoice Number', 'Quantity','Phone No','Cash Amount','Cheque Amount',' Other Amount', 'Order Status','Remarks'], 
      nullToEmptyString: true,
    };
    new ngxCsv(report, 'Order-List', options);
  }
  printCashData(id) {
    let table = '';
    this.orderService.getPrintableData(id,this.userID).subscribe(res=> {
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
        <div class="order-section">
          <div class="order-item">
            <div class="order-no-lbl">OrderNo</div>
            <div class="order-no-value">: ${this.printHeaderInfo.OrderNumber}</div>
          </div>
          <div class="order-item">
            <div class="order-no-lbl">Order Date</div>
            <div class="order-no-value">: ${this.printHeaderInfo.OrderDate}</div>
          </div>
          <div class="order-item">
            <div class="order-no-lbl">Payment Mode</div>
            <div class="order-no-value">: ${this.printHeaderInfo.PaymentMode ? this.printHeaderInfo.PaymentMode : 'N/A'}</div>
          </div>
          <div class="order-item">
            <div class="order-no-lbl">Invoice Type</div>
            <div class="order-no-value">: ${this.printHeaderInfo.InvoiceType ? this.printHeaderInfo.InvoiceType : 'N/A'}</div>
          </div>
          <div class="order-item">
            <div class="order-no-lbl">Invoice Number</div>
            <div class="order-no-value">: ${this.printHeaderInfo.InvoiceNumber ? this.printHeaderInfo.InvoiceNumber : 'N/A'}</div>
          </div>
          <div class="order-item">
            <div class="order-no-lbl">Membership No</div>
            <div class="order-no-value">: ${this.printHeaderInfo.MembershipNo ? this.printHeaderInfo.MembershipNo : 'N/A'}</div>
          </div>
          <div class="order-item">
            <div class="order-no-lbl">GST No</div>
            <div class="order-no-value">: ${this.printHeaderInfo.GSTNO ? this.printHeaderInfo.GSTNO : 'N/A'}</div>
          </div>
          <div class="order-item">
            <div class="order-no-lbl">Transporter</div>
            <div class="order-no-value">: ${this.printHeaderInfo.Transporter ? this.printHeaderInfo.Transporter : 'N/A'}</div>
          </div>
          <div class="order-item">
            <div class="order-no-lbl">Shop Name</div>
            <div class="order-no-value">: ${this.printHeaderInfo.Shop ? this.printHeaderInfo.Shop : 'N/A'}</div>
          </div>
          <div class="order-item">
            <div class="order-no-lbl">Lead Type</div>
            <div class="order-no-value">: ${this.printHeaderInfo.LeadType ? this.printHeaderInfo.LeadType : 'N/A'}</div>
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
                        <th>SN</th>
                        <th>Description of Goods</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                        <th>Price</th>
                        <th>Amount</th>
                      </thead>
                      <tbody>
                        ${this.getTableRows(this.printDetailInfo)}
                        <tr>
                          <td colspan="5"></td>
                          <td class="text-align-right">${this.printHeaderInfo.SubTotalAmount}</td>
                        </tr>
                        <tr>
                          <td colspan="5" class="text-align-right">Frieght Charges</td>
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
        <td>${data[i].PRODUCTCODE}</td>
        <td class="text-align-right">${data[i].Quantity}</td>
        <td>${data[i].Unit}</td>
        <td class="text-align-right">${data[i].Price}</td>
        <td class="text-align-right">${data[i].Amount}</td>
      </tr>`
    }
    return html;
  }
}
