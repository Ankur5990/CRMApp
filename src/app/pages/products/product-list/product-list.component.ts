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
import { ProductService } from '../product.service';
import { TheadFitlersRowComponent } from 'ng2-smart-table/lib/components/thead/rows/thead-filters-row.component';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  productListTask;
  buttonAction = false;
  allProductList = [];
  allColor = [];
  allFit = [];
  allCategory = [];
  allProductType = [];
  allVarient = [];
  noProductFound = '';
  refreshMessage = "Please click View button to get latest data";
  showLoader = false;
  lookUpData;
  userID;
  searchProductTerm$ = new Subject<string>();
  searchProductKey = '';
  printHeaderInfo;
  printDetailInfo;
  constructor(protected userService: UserService, private productService: ProductService,
    private sharedService: SharedService, private activatedRoute: ActivatedRoute,
    protected cacheService: CacheService, protected modalService: NgbModal,
    private notification: NotificationsService, private genericSort: GenericSort) { }

  ngOnInit() {
    this.userID = localStorage.getItem('UserLoginId');
    this.allProductList = [];
    this.productListTask = this.productService.getProductObject();
    this.productListTask = JSON.parse(JSON.stringify(this.productListTask));
    this.productListTask.ProductTypeID = 1;
    this.productListTask.FitID = 1;
    this.productListTask.ColorID = 1;
    this.productListTask.ProductCategoryID = 1;
    this.productListTask.GenderID = 1;
    this.productListTask.SourceID = 1;
    this.productListTask.searchby = 1;
    if (this.cacheService.has("listProductFilterData")) {
      this.cacheService.get("listProductFilterData").subscribe((res) => {
        this.productListTask = JSON.parse(JSON.stringify(res));
        if(res.searchby == 1) {
          this.searchProductKey = res.searchtext;
        } else {
          this.searchProductKey = '';
        }
        if(this.cacheService.has('allProductList')) {
          this.cacheService.get('allProductList').subscribe(res => {
            this.allProductList = JSON.parse(JSON.stringify(res));
          })
        }
      });
    }
    if(this.cacheService.has("redirectToProductList")) {
      this.cacheService.deleteCache('redirectToProductList');
      this.cacheService.get('allProductList').subscribe(res => {
        this.allProductList = JSON.parse(JSON.stringify(res));
      })
    }
    if(this.cacheService.has("redirectAfterProductSave")) {
      this.cacheService.deleteCache('redirectAfterProductSave');
      this.allProductList = [];
      if(this.productListTask.searchby == 2) {
        this.validateData();
        if(this.buttonAction) {
          this.getAllProducts();
        }
      } else if(this.productListTask.searchby == 1) {
        this.showLoader = true;
        this.productService.searchEntries(this.searchProductKey, this.userID).subscribe(res => {
          this.showLoader = false;
          if(res['ProductList'].length == 0) {
            this.allProductList = [];
            this.noProductFound = "No Washing Found";
            this.refreshMessage = '';
          } else {
            this.allProductList = res[' ProductList'];
            if(res['ProductList'].length > 0) {
              this.cacheService.set("allProductList", this.allProductList);
              if(sessionStorage.getItem('searchProductValue')) {
                this.productListTask.searchtext = sessionStorage.getItem('searchProductValue');
              }
              this.cacheService.set("listProductFilterData", this.productListTask);
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
    this.productService.search(this.searchProductTerm$,this.userID)
    .subscribe(results => {
      if(results['ProductList'].length == 0) {
        this.allProductList = [];
        this.noProductFound = "No Product Found";
        this.refreshMessage = '';
      } else {
        this.allProductList = results['ProductList'];
        if(results['ProductList'].length > 0) {
          this.cacheService.set("allProductList", this.allProductList);
          if(sessionStorage.getItem('searchProductValue')) {
            this.productListTask.searchtext = sessionStorage.getItem('searchProductValue');
          }
          this.cacheService.set("listProductFilterData", this.productListTask);
        }
      }
    });
  }

  getMasterData() {
    this.showLoader = true;
    this.productService.getMasterData(this.userID).subscribe(res => {
      this.showLoader = false;
      let lookUpData = JSON.parse(JSON.stringify(res));
      this.allColor = lookUpData.Color;
      this.allFit = lookUpData.FIT;
      this.allCategory = lookUpData.ProductCategory;
      this.allProductType = lookUpData.ProductType;
      this.allVarient = lookUpData.ProductVarient;
    },(error)=> {
      this.showLoader = false;
      this.notification.error('Error','Error While Lookup Master Data');
    })
  }

  printTable() {
    var divToPrint = document.getElementById("product-container");  
    let newWin = window.open("");  
    newWin.document.write(divToPrint.outerHTML);  
    newWin.print();  
    newWin.close();
  }
  exportToCSV() {
    const report = [];
    this.allProductList.forEach((productInfo) => {
      report.push({
        ProductID: productInfo.ProductID,
        ProductCode: productInfo.ProductCode,
        ProductDesc: productInfo.ProductDesc,
        ProductCatogery: productInfo.ProductCatogery,
        ProductType: productInfo.ProductType,
        Gender: productInfo.Gender,
        Color: productInfo.Color,
        Fit: productInfo.Fit,
        MRP: productInfo.MRP,
        CostPrice: productInfo.CostPrice,
        SellingPrice: productInfo.SellingPrice,
        BarCode: productInfo.BarCode,
        ProductSource: productInfo.ProductSource,
        Active: productInfo.Active,
        Remark: productInfo.Remark,
      });
    });

    const options = {
      headers: ['Product Id', 'Product Code', 'Product Desc','Product Catogery','Product Type', 'Gender','Color', 'Fit Type', 'Mrp', 'Cost Price', 'Selling Price', 'Bar Code', 'Source', 'Active', 'Remark'],
      nullToEmptyString: true,
    };
    new ngxCsv(report, 'product-List', options);
  }
  refreshDataHandler() {
    this.validateData();
    if (this.allProductList.length || this.noProductFound != '') {
      this.allProductList = [];
      this.noProductFound = "";
      this.refreshMessage = "Please click View button to get latest data";
    }
  }

  validateData() {
    if (this.productListTask.ProductCategoryID > 0 && this.productListTask.ProductTypeID > 0 && this.productListTask.GenderID > 0
      && this.productListTask.FitID > 0 && this.productListTask.SourceID > 0 && this.productListTask.ColorID > 0) {
      this.buttonAction = true;
      return true;
    } else {
      this.buttonAction = false;
      return false;
    }
  }
  valueChange(txt) {
    this.allProductList = [];
    if(txt == 'other') {
      this.searchProductKey = '';
    }
    if(this.productListTask.searchby == 1) {
      this.refreshMessage = 'Please search to get latest data';
    } else {
      this.refreshMessage = 'Please click View button to get latest data'
    }
  }
  getAllProducts() {
    const productTask = JSON.parse(JSON.stringify(this.productListTask));
    this.showLoader = true;
    this.productService.getAllProducts(productTask.ProductTypeID, productTask.GenderID, productTask.FitID, productTask.ColorID,
      productTask.ProductCategoryID, productTask.SourceID, this.userID).subscribe((res) => {
      this.showLoader = false;
      if (!res['ProductList'].length) {
        this.allProductList = [];
        this.noProductFound = "No Product Found";
      } else {
        this.allProductList = res['ProductList'];
        this.refreshMessage = "";
        this.noProductFound = "";
        this.cacheService.set("allProductList", this.allProductList);
        this.cacheService.set("listProductFilterData", this.productListTask);
      }
    },(error) => {
      this.showLoader = false;
      this.allProductList = [];
      this.notification.error('Error','Something went wrong, Please try later !!!');
    })
  }
  // printCashData(id) {
  //   let table = '';
  //   this.productService.getPrintableData(id,this.userID).subscribe(res=> {
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
