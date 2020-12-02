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
import { PurchaseOrderService } from '../purchase-order.service';

@Component({
  selector: 'app-purchase-order-list',
  templateUrl: './purchase-order-list.component.html',
  styleUrls: ['./purchase-order-list.component.scss']
})
export class PurchaseOrderListComponent implements OnInit {
  purchaseListTask;
  todaysDate;
  buttonAction = false;
  allPurchaseList = [];
  allItemType = [];
  allSupplier = [];
  noPurchaseFound = '';
  refreshMessage = "Please click View button to get latest data";
  showLoader = false;
  lookUpData;
  allCustomer;
  userID;
  searchTerm$ = new Subject<string>();
  results;
  searchKey = '';
  constructor(protected userService: UserService, private purchaseService: PurchaseOrderService,
    private sharedService: SharedService, private activatedRoute: ActivatedRoute,
    protected cacheService: CacheService, protected modalService: NgbModal,
    private notification: NotificationsService, private genericSort: GenericSort) { }

  ngOnInit() {
    this.userID = localStorage.getItem('UserLoginId');
    this.allPurchaseList = [];
    this.purchaseListTask = this.purchaseService.getPurchaseObject();
    this.purchaseListTask = JSON.parse(JSON.stringify(this.purchaseListTask));
    this.purchaseListTask.Supplier = 1;
    this.purchaseListTask.ItemType = 1;
    this.purchaseListTask.searchby = 1;
    const now = new Date();
    this.todaysDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    this.purchaseListTask.startDate = this.todaysDate;
    this.purchaseListTask.endDate = this.todaysDate;
    if (this.cacheService.has("listPurchaseFilterData")) {
      this.cacheService.get("listPurchaseFilterData").subscribe((res) => {
        this.purchaseListTask = JSON.parse(JSON.stringify(res));
        if(res.searchby == 1) {
          this.searchKey = res.searchtext;
        } else {
          this.searchKey = '';
        }
        if(this.cacheService.has('allPurchaseList')) {
          this.cacheService.get('allPurchaseList').subscribe(res => {
            this.allPurchaseList = JSON.parse(JSON.stringify(res));
          })
        }
      });
    }
    if(this.cacheService.has("redirectToPurchaseList")) {
      this.cacheService.deleteCache('redirectToPurchaseList');
      this.cacheService.get('allPurchaseList').subscribe(res => {
        this.allPurchaseList = JSON.parse(JSON.stringify(res));
      })
    }
    if(this.cacheService.has("redirectAfterOrderSave")) {
      this.cacheService.deleteCache('redirectAfterOrderSave');
      this.allPurchaseList = [];
      if(this.purchaseListTask.searchby == 2) {
        this.validateData();
        if(this.buttonAction) {
          this.getAllPurchaseOrders();
        }
      } else if(this.purchaseListTask.searchby == 1) {
        this.showLoader = true;
        this.purchaseService.searchEntries(this.searchKey, this.userID).subscribe(res => {
          this.showLoader = false;
          if(res['PurchaseOrderList'].length == 0) {
            this.allPurchaseList = [];
            this.noPurchaseFound = "No Purchase Order Found";
            this.refreshMessage = '';
          } else {
            this.allPurchaseList = res['PurchaseOrderList'];
            if(res['PurchaseOrderList'].length > 0) {
              this.cacheService.set("allPurchaseList", this.allPurchaseList);
              if(sessionStorage.getItem('searchPurchaseValue')) {
                this.purchaseListTask.searchtext = sessionStorage.getItem('searchPurchaseValue');
              }
              this.cacheService.set("listPurchaseFilterData", this.purchaseListTask);
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
    this.purchaseService.search(this.searchTerm$,this.userID)
    .subscribe(results => {
      if(results['PurchaseOrderList'].length == 0) {
        this.allPurchaseList = [];
        this.noPurchaseFound = "No Purchase Order Found";
        this.refreshMessage = '';
      } else {
        this.allPurchaseList = results['PurchaseOrderList'];
        if(results['PurchaseOrderList'].length > 0) {
          this.cacheService.set("allPurchaseList", this.allPurchaseList);
          if(sessionStorage.getItem('searchPurchaseValue')) {
            this.purchaseListTask.searchtext = sessionStorage.getItem('searchPurchaseValue');
          }
          this.cacheService.set("listPurchaseFilterData", this.purchaseListTask);
        }
      }
    });
  }

  getMasterData() {
    this.showLoader = true;
    this.purchaseService.getMasterData(this.userID).subscribe(res => {
      this.showLoader = false;
      let lookUpData = JSON.parse(JSON.stringify(res));
      this.allItemType = lookUpData.ItemType;
      this.allSupplier = lookUpData.Vendor;
    },(error)=> {
      this.showLoader = false;
      this.notification.error('Error','Error While Lookup Master Data');
    })
  }

  printTable() {
    var divToPrint = document.getElementById("purchase-container");  
    let newWin = window.open("");  
    newWin.document.write(divToPrint.outerHTML);  
    newWin.print();  
    newWin.close();
  }
  exportToCSV() {
    const report = [];
    this.allPurchaseList.forEach((purchaseInfo) => {
      report.push({
        PONumber: purchaseInfo.PONumber,
        ItemType: purchaseInfo.ItemType,
        Supplier: purchaseInfo.Supplier,
        RefInvoiceNumber: purchaseInfo.RefInvoiceNumber,
        PurchaseDate: purchaseInfo.PurchaseDate,
        UserName: purchaseInfo.UserName,
      });
    });

    const options = { 
      headers: ['PO Number', 'Item Type', 'Supplier','Priority','Ref Invoice Number', 'Purchase Date', 'User Name'], 
      nullToEmptyString: true,
    };
    new ngxCsv(report, 'Purchase-List', options);
  }
  refreshDataHandler() {
    this.validateData();
    if (this.allPurchaseList.length || this.noPurchaseFound != '') {
      this.allPurchaseList = [];
      this.noPurchaseFound = "";
      this.refreshMessage = "Please click View button to get latest data";
    }
  }

  validateData() {
    if (this.purchaseListTask.ItemType != 0 && this.purchaseListTask.Supplier !=0) {
      this.buttonAction = true;
      return true;
    } else {
      this.buttonAction = false;
      return false;
    }
  }
  valueChange(txt) {
    this.allPurchaseList = [];
    if(txt == 'other') {
      this.searchKey = '';
    }
    if(this.purchaseListTask.searchby == 1) {
      this.refreshMessage = 'Please search to get latest data';
    } else {
      this.refreshMessage = 'Please click View button to get latest data'
    }
  }
  getAllPurchaseOrders() {
    const puchaseTask = JSON.parse(JSON.stringify(this.purchaseListTask));
    const startDate = `${puchaseTask.startDate.month}/${puchaseTask.startDate.day}/${puchaseTask.startDate.year}`;
    const endDate = `${puchaseTask.endDate.month}/${puchaseTask.endDate.day}/${puchaseTask.endDate.year}`;
    this.showLoader = true;
    this.purchaseService.getAllPuchaseOrders(startDate,endDate,puchaseTask.Supplier,puchaseTask.ItemType, this.userID).subscribe((res) => {
      this.showLoader = false;
      if (!res['PurchaseOrderList'].length) {
        this.allPurchaseList = [];
        this.noPurchaseFound = "No Purchase Order Found";
      } else {
        this.allPurchaseList = res['PurchaseOrderList'];
        this.refreshMessage = "";
        this.noPurchaseFound = "";
        this.cacheService.set("allPurchaseList", this.allPurchaseList);
        this.cacheService.set("listPurchaseFilterData", this.purchaseListTask);
      }
    },(error) => {
      this.showLoader = false;
      this.allPurchaseList = [];
      this.notification.error('Error','Something went wrong, Please try later !!!');
    })
  }
}
