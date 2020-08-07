import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { StockService } from '../stock.service';
import { CacheService } from 'app/shared/cache.service';

@Component({
  selector: 'app-create-stock',
  templateUrl: './create-stock.component.html',
  styleUrls: ['./create-stock.component.scss']
})
export class CreateStockComponent implements OnInit {
  showLoader = false;
  cardTitle = 'CREATE STOCK';
  isViewOnly = false;
  isEditOnly = false;
  createStock;
  allWashers = [];
  allProducts = [];
  selectedProduct = [];
  userID = '';
  StockID = 0;
  todaysDate;
  disableOthers = false;
  displayQuantityWarning = false;
  constructor(private orderService: StockService,
    private router: Router, private activatedRoute: ActivatedRoute, private notification: NotificationsService,private cacheService: CacheService) { }

    ngOnInit() {
      const now = new Date();
      this.todaysDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
      this.userID = localStorage.getItem('UserLoginId');
      this.createStock = this.orderService.getOrdersObject();
      this.createStock = JSON.parse(JSON.stringify(this.createStock));
      this.createStock.StockDate = this.todaysDate;
      this.createStock.LotNo = '';
      this.createStock.Cutting = '';
      this.createStock.Sample = '';
      this.createStock.Rate = '';
      this.createStock.Issue = '';
      this.createStock.Recieve = '';
      this.createStock.Balance = 0;
      this.createStock.Washer = 0;
      this.createStock.Washing = '';
      this.getWasherData();
      this.getAllProducts();
      const activatedRouteObject = this.activatedRoute.snapshot.data;
      if(activatedRouteObject['viewMode'] === true) {
        this.isViewOnly = true;
        this.cardTitle = 'VIEW STOCK'
        const stockId = this.activatedRoute.snapshot.params.stockId;
        this.StockID = stockId;
        this.getDetails(stockId);
      } else if(activatedRouteObject['editMode'] === true) {
        this.disableOthers = true;
        this.isEditOnly = true;
        this.cardTitle = 'EDIT STOCK'
        const stockId = this.activatedRoute.snapshot.params.stockId;
        this.StockID = stockId;
        this.getDetails(stockId);
      }
      if(!(this.isEditOnly || this.isViewOnly)) {
        this.selectedProduct.push({grn:0, quantity: 0});
      }
    }
    getWasherData() {
      this.orderService.getWasherData().subscribe(res => {
        this.allWashers = JSON.parse(JSON.stringify(res['Washer']));  
      }, err=> {
        console.log(err);
      })
    }
    getAllProducts() {
      this.orderService.getAllProducts().subscribe(res => {
        this.allProducts = res['Product'];
      }, err=> {
        console.log(err);
      })
    }
    onProductChange(item) {
      if(this.selectedProduct.length > 0) {
        let len = 0;
        for(let i=0; i< this.selectedProduct.length; i++) {
          if(this.selectedProduct[i].PRODUCTID == item.PRODUCTID) {
              len++;
          }
        }
        if(len > 1) {
          this.notification.error('error', 'Can not select same product again !!!');
          item.PRODUCTID = 0;
          return;
        }
      }
    }
    addProductRow() {
      this.selectedProduct.push({grn: 0, quantity: 0});
    }
    onDelete(i) {
      this.selectedProduct.splice(i,1);
    }
    getDetails(id) {
      this.showLoader = true;
      this.orderService.getStockDetails(id,this.userID).subscribe(res => {
        this.showLoader = false;
        const resp = JSON.parse(JSON.stringify(res));
        this.populateAllData(resp);
      },(err) => {
        this.showLoader = false;
      })
    }
    populateAllData(resp) {
      if(resp.Stock.length > 0){
        let allValues = resp.Stock[0];
        let stockDateArray = allValues.StockDate.split('/');
        this.createStock.StockDate = { year: +stockDateArray[2], month: +stockDateArray[0], day: +stockDateArray[1] };
        this.createStock.LotNo = allValues.LotNo;
        this.createStock.Cutting = allValues.CuttingQty;
        this.createStock.Sample = allValues.SampleQty;
        this.createStock.Rate = allValues.Rate;
        this.createStock.Issue = allValues.IssueQty;
        this.createStock.Recieve = allValues.ReceiveQty;
        this.createStock.Balance = allValues.IssueQty - allValues.ReceiveQty;
        this.createStock.Washer = allValues.WasherID;
        this.createStock.Washing = allValues.Washing;
      }
      if(resp.StockDetail.length > 0) {
        let allProductDetails = resp.StockDetail;
        for(let i=0; i< allProductDetails.length; i++) {
          this.selectedProduct.push({PRODUCTID: allProductDetails[i].ProductID,
            ProductCode: allProductDetails[i].PRODUCTCODE,
            ProductDesc: allProductDetails[i].PRODUCTDESC,
            quantity: allProductDetails[i].Quantity,
            grn: allProductDetails[i].GRNQuantity,
            alreadyStored: true
          })
        }
      }
    }
    validateData() {
      this.displayQuantityWarning = false;
      if(this.createStock.LotNo != '' && this.createStock.Issue != '' && this.createStock.Issue > 0 &&
         this.createStock.Recieve != '' && this.createStock.Washer > 0 && this.validateProducts()) {
          return true;
        }
      return false;
    }
    validateProducts() {
      let flag;
      for(let i=0; i< this.selectedProduct.length; i++) {
        if(this.selectedProduct[i].PRODUCTID && this.selectedProduct[i].PRODUCTID !=0 && this.selectedProduct[i].quantity > 0) {
          flag = true;
        } else {
          flag = false;
          if(this.selectedProduct[i].PRODUCTID && this.selectedProduct[i].PRODUCTID !=0 && ((!this.selectedProduct[i].quantity) || this.selectedProduct[i].quantity == 0)) {
            this.displayQuantityWarning = true;
          }
          return false;
        }
      }
      if(flag == true) {
        return true;
      }
      return false;
    }
    goToListPage() {
      if (this.cacheService.has("allStocksList")) {
        this.cacheService.set("backToStockList", 'back');
      }
      this.router.navigate(['/pages/stock-management/list']);
    }
    submitOrder() {
      if(!this.validateData()) {
        if(this.displayQuantityWarning) {
          this.notification.error('Error', 'Quantity is always greater than Zero !!!');
          return;
        }
        this.notification.error('Error', 'Please fill all the mandatory information !!!')
        return;
      }
      let productDetails = [];
      for(let i=0; i<this.selectedProduct.length; i++) {
        productDetails.push({
          ProductID : this.selectedProduct[i].PRODUCTID,
          Quantity: this.selectedProduct[i].quantity,
        })
      }
      let postData = {
        "StockManagementID": this.StockID,
        "StockDate": `${this.createStock.StockDate.month}/${this.createStock.StockDate.day}/${this.createStock.StockDate.year}`,
        "LotNo": this.createStock.LotNo,
        "WasherID": this.createStock.Washer,
        "Washing": this.createStock.Washing,
        "CuttingQty": this.createStock.Cutting == '' ? 0 : this.createStock.Cutting,
        "IssueQty": this.createStock.Issue,
        "ReceiveQty": this.createStock.Recieve,
        "SampleQty": this.createStock.Sample == '' ? 0 : this.createStock.Sample,
        "Rate": this.createStock.Rate == '' ? 0 : this.createStock.Rate,
        "CreatedBy": this.userID,
        "StockDetail": productDetails
      }
      this.showLoader = true;
      this.orderService.createStock(postData).subscribe(res => {
        this.showLoader = false;
        console.log(res);
        const resp = JSON.parse(JSON.stringify(res));
        if(resp.Error[0].ERROR == 0) {
          if (this.cacheService.has("allStocksList")) {
            this.cacheService.set("redirectAfterStockSave", 'saved');
            if (this.cacheService.has("stockFilterData")) {
              this.cacheService.get("stockFilterData").subscribe((res) => {
                let resp = JSON.parse(JSON.stringify(res));
                resp.Washer = 1;
                resp.startDate = this.createStock.StockDate;
                resp.endDate = this.createStock.StockDate;
                this.cacheService.set("stockFilterData", resp);
              });
            }
          }
          this.notification.success('Success', resp.Error[0].Msg);
          this.router.navigate(['pages/stock-management/list']);
        } else {
          this.notification.error('Error', resp.Error[0].Msg);
        }
      }, err => {
        this.showLoader = false;
        this.notification.error('Error', 'Something went wrong!');
      })
    }
    displayBalance() {
      if(this.createStock.Issue == '' && this.createStock.Recieve == '') {
        this.createStock.Balance = 0;
      } else if(this.createStock.Issue == '' && this.createStock.Recieve != '') {
        this.createStock.Balance = 0 - (+this.createStock.Recieve);
      } else if(this.createStock.Issue != '' && this.createStock.Recieve == '') {
        this.createStock.Balance = (+this.createStock.Issue) - 0;
      } else {
        this.createStock.Balance = (+this.createStock.Issue) - (+this.createStock.Recieve);
      }
    }
}