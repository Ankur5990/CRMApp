import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OrderService } from '../orders.service';
import { UserService } from '../../../shared/user.service';
import { GenericSort } from '../../../shared/pipes/generic-sort.pipe';
import { CacheService } from '../../../shared/cache.service';
import * as _ from 'lodash';
import { isNgTemplate } from '@angular/compiler';

@Component({
  selector: 'app-create-order',
  templateUrl: './create-order.component.html',
  styleUrls: ['./create-order.component.scss']
})
export class CreateOrderComponent implements OnInit {
  showLoader = false;
  cardTitle = 'CREATE ORDER';
  isViewOnly = false;
  isEditOnly = false;
  createOrder;
  allStatus = [];
  allOrderTypes = [];
  totalCities = [];
  allPaymentMode = [];
  allCustomerList = [];
  allProducts = [];
  selectedProduct = [];
  allTransporter = [];
  allCompany = [];
  allSize = [];
  userID = '';
  OrderID = 0;
  ProductId;
  todaysDate;
  rate = 0;
  discountedValue = 0;
  totalAmount = 0;
  finalAmount = 0;
  showDelete = false;
  disablePayment = false;
  disableStatus = false;
  disableOthers = false;
  statusId;
  customerNameWithAddress = '';
  enableVoidOrder = false;
  constructor(protected userService: UserService, private orderService: OrderService,
    private router: Router, private activatedRoute: ActivatedRoute,
    protected cacheService: CacheService, protected modalService: NgbModal,
    private notification: NotificationsService, private genericSort: GenericSort) { }

    ngOnInit() {
      const now = new Date();
      this.todaysDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
      this.userID = localStorage.getItem('UserLoginId');
      this.createOrder = this.orderService.getOrdersObject();
      this.createOrder = JSON.parse(JSON.stringify(this.createOrder));
      this.createOrder.OrderDate = this.todaysDate;
      this.createOrder.OrderType = 2;
      this.refreshDataHandler('typeChange');
      this.createOrder.OrderStatus = 'PP';
      this.createOrder.PaymentId = 0;
      this.createOrder.CustomerId = 0;
      this.createOrder.DispatchNo = '';
      this.createOrder.discount = 0;
      this.createOrder.FreightCharge = 0;
      this.createOrder.Transporter = 0;
      this.createOrder.Company = 1;
      this.disablePayment = true;
      this.disableStatus = true;
      this.getMasterData();
      this.getAllProducts();
      const activatedRouteObject = this.activatedRoute.snapshot.data;
      if(activatedRouteObject['viewMode'] === true) {
        this.isViewOnly = true;
        this.cardTitle = 'VIEW ORDER'
        const orderId = this.activatedRoute.snapshot.params.orderId;
        this.OrderID = orderId;
        this.getDetails(orderId);
      } else if(activatedRouteObject['editMode'] === true) {
        this.disablePayment = false;
        this.isEditOnly = true;
        this.cardTitle = 'EDIT ORDER'
        const orderId = this.activatedRoute.snapshot.params.orderId;
        this.OrderID = orderId;
        this.getDetails(orderId);
      }
      if(!(this.isEditOnly || this.isViewOnly)) {
        this.selectedProduct.push({});
      }
      this.displayDeleteIcon();
    }
    displayDeleteIcon() {
      if(this.selectedProduct.length > 1) {
        this.showDelete = true;
      } else {
        this.showDelete = false;
      }
    }
    getMasterData() {
      this.showLoader = true;
      this.orderService.getMasterData().subscribe(res => {
        this.showLoader = false;
        let lookUpData = JSON.parse(JSON.stringify(res));
        this.allPaymentMode = lookUpData.PaymentMode;
        this.allStatus = lookUpData.OrderStatus;
        this.allTransporter = lookUpData.Transporter;
        this.allCompany = lookUpData.Company;
      },(error)=> {
        this.showLoader = false;
        this.notification.error('Error','Error While Lookup Master Data');
      })
    }
    getAllProducts() {
      const id = 0
      this.orderService.getAllProducts().subscribe(res => {
        this.allProducts = res['Product'];
        this.allSize = res['ProductSize'];
      }, err=> {
        console.log(err);
      })
    }
    onProductChange(item) {
      for(let i=0; i<this.allProducts.length; i++) {
          if(this.allProducts[i].PRODUCTID == item.PRODUCTID) {
            item.Rate = this.allProducts[i].Rate;
            item.Quantity = 0;
          }
      } 
    }
    addProductRow() {
      this.selectedProduct.push({});
    }
    calculateTotals() {
      this.totalAmount = 0;
      this.discountedValue = 0;
      this.finalAmount = 0;
        for(let i=0; i<this.selectedProduct.length; i++) {
          this.totalAmount = this.totalAmount + this.selectedProduct[i].Amount;
        }
        this.discountedValue = (this.totalAmount * this.createOrder.discount)/100;
        this.finalAmount = this.totalAmount + (+this.createOrder.FreightCharge) - this.discountedValue;
    }
    onDiscountChange() {
      if(this.selectedProduct[0].Amount) {
        this.calculateTotals();
      }
    }
    onFreightChargeChange() {
      if(this.selectedProduct[0].Amount) {
        this.calculateTotals();
      }
    }
    unitChangeHandler(item) {
      item.Amount = +item.Quantity * +item.Rate;
      this.calculateTotals();
    }
    onDelete(i) {
      this.selectedProduct.splice(i,1);
      this.calculateTotals();
    }
    getDetails(id) {
      this.showLoader = true;
      this.orderService.getOrderDetails(id,this.userID).subscribe(res => {
        this.showLoader = false;
        const resp = JSON.parse(JSON.stringify(res));
        this.populateAllData(resp);
      },(err) => {
        this.showLoader = false;
      })
    }
    populateAllData(resp) {
      if(resp.Order.length > 0) {
        let allValues = resp.Order[0];
        this.statusId = allValues.OrderStatusID;
        let orderDateArray = allValues.OrderDate.split('/');
        this.createOrder.OrderType = allValues.OrderTypeID;
        this.createOrder.OrderStatus = allValues.OrderStatusCode;
        if(allValues.OrderStatusCode == 'PD') {
          this.disablePayment = true;
          this.disableOthers = true;
        }
        if(allValues.OrderStatusCode == 'PP' && this.isEditOnly == true) {
          this.enableVoidOrder = true;
        }
        this.customerNameWithAddress = `${allValues.CustomerName}, ${allValues.Address}`;
        this.createOrder.PaymentId = allValues.PaymentModeID;
        this.createOrder.CustomerId = allValues.LeadID == 0 ? allValues.CustomerID : allValues.LeadID;
        this.createOrder.DispatchNo = allValues.DispatchNo;
        this.createOrder.discount = allValues.DiscountPercentage;
        this.createOrder.FreightCharge = allValues.FreightAmount;
        this.createOrder.Transporter = allValues.TransporterID;
        this.createOrder.Company = allValues.CompanyID;
        this.createOrder.OrderDate = { year: +orderDateArray[2], month: +orderDateArray[0], day: +orderDateArray[1] };
        this.refreshDataHandler('typeChange');
      }
      if(resp.OrderDetail.length > 0) {
        let allProductDetails = resp.OrderDetail;
        for(let i=0; i< allProductDetails.length; i++) {
           this.selectedProduct.push({PRODUCTID: allProductDetails[i].ProductID,
             SizeID: allProductDetails[i].SizeID,
             Quantity: allProductDetails[i].Quantity,
             Rate: allProductDetails[i].SP,
             Amount: +allProductDetails[i].Quantity * +allProductDetails[i].SP,
             OrderDetailId: allProductDetails[i].OrderDetailID,
             ProductName: `${allProductDetails[i].PRODUCTCODE} - ${allProductDetails[i].PRODUCTDESC}`,
             SizeValue: allProductDetails[i].Size,
             alreadyStored: true})
        }
        this.calculateTotals();
      }
    }
  
    refreshDataHandler(byType: any = '') {
      if(byType === "typeChange") {
        if(this.createOrder.OrderType != 0) {
          this.orderService.getListOnType(this.createOrder.OrderType, this.userID).subscribe(res => {
            this.allCustomerList = res['Customer'];
          }, err=> {
            this.notification.error('Error', 'Something went wrong while fetching customer detail !!!');
          })
        }
      }
      if(byType=="paymentMode" || byType=="transporter") {
        if(this.createOrder.PaymentId > 0 && this.createOrder.Transporter == 0) {
          this.createOrder.OrderStatus = "PD";
          this.createOrder.DispatchNo = '';
        } else if(this.createOrder.PaymentId > 0 && this.createOrder.Transporter > 0) {
          this.createOrder.OrderStatus = "C";
        } else if(this.createOrder.PaymentId == 0) {
          this.createOrder.OrderStatus = "PP";
          this.createOrder.Transporter = 0;
        }
      }
    }

    validateData() {
      if(this.createOrder.CustomerId != 0 
        && this.validateProducts()) {
          return true;
        }
      return false;
    }
    validateProducts() {
      let flag;
      for(let i=0; i< this.selectedProduct.length; i++) {
        if(this.selectedProduct[i].PRODUCTID && this.selectedProduct[i].PRODUCTID !=0 && 
          this.selectedProduct[i].Quantity && this.selectedProduct[i].Quantity !=0 && 
          this.selectedProduct[i].SizeID && this.selectedProduct[i].SizeID !=0) {
          flag = true;
        } else {
          flag = false;
          return false;
        }
      }
      if(flag == true) {
        return true;
      }
      return false;
    }
    goToListPage() {
      this.router.navigate(['/pages/orders/list']);
    }
    submitOrder() {
      if(!this.validateData()) {
        this.notification.error('Error', 'Please fill all the mandatory information !!!')
        return;
      }
      let productDetails = [];
      for(let i=0; i<this.selectedProduct.length; i++) {
          productDetails.push({
            ProductID : this.selectedProduct[i].PRODUCTID,
            SizeID: this.selectedProduct[i].SizeID,
            Quantity: this.selectedProduct[i].Quantity,
            Rate: this.selectedProduct[i].Rate
          })
      }
      const statusResult = this.allStatus.find(x=> x.Code == this.createOrder.OrderStatus);
      let postData = {
        "OrderID": this.OrderID,
        "OrderDate": `${this.createOrder.OrderDate.month}/${this.createOrder.OrderDate.day}/${this.createOrder.OrderDate.year}`,
        "OrderTypeID": this.createOrder.OrderType,
        "LeadID": this.createOrder.OrderType == 2 ? this.createOrder.CustomerId : 0,
        "CustomerID": this.createOrder.OrderType == 3 ? this.createOrder.CustomerId : 0,
        "CompanyID": this.createOrder.Company,
        "DiscountPercentage": this.createOrder.discount,
        "OrderStatusID": statusResult.OrderStatusID,
        "PaymentModeID": this.createOrder.PaymentId,
        "DispatchNo": this.createOrder.DispatchNo,
        "TransporterID": this.createOrder.Transporter ? this.createOrder.Transporter : 0,
        "FreightAmount": this.createOrder.FreightCharge,
        "CreatedBy": this.userID,
        "TotalAmount": this.finalAmount,
        "OrderDetail": productDetails
      }
      this.showLoader = true;
      this.orderService.createOrder(postData).subscribe(res => {
        this.showLoader = false;
        console.log(res);
        const resp = JSON.parse(JSON.stringify(res));
        if(resp.Error[0].ERROR == 0) {
          this.notification.success('Success', resp.Error[0].Msg);
          this.router.navigate(['pages/orders/list']);
        } else {
          this.notification.error('Error', resp.Error[0].Msg);
        }
      }, err => {
        this.showLoader = false;
        this.notification.error('Error', 'Something went wrong!');
      })
    }
    VoidOrder() {
      this.showLoader = true;
      this.orderService.voidOrder(this.OrderID, this.userID).subscribe(res => {
        this.showLoader = false;
        if(res['Error'] && res['Error'][0]) {
          const mainObj = res['Error'][0];
          if(mainObj.ERROR == 0) {
            this.notification.success(mainObj.Msg);
            this.router.navigate(['/pages/orders/list']);
          } else {
            this.notification.error('Error', mainObj.Msg);
          }
        } else {
          this.notification.error('Error', 'Something went wrong while Void Order');
        }
      }, err => {
        this.showLoader = false;
        this.notification.error('Error', 'Something went wrong while Void Order');
      })
    }
    removeZero(type) {
      if(type == 'discount') {
        if(this.createOrder.discount == 0) {
          this.createOrder.discount = '';
        }
      } else if(type == 'frieght') {
        if(this.createOrder.FreightCharge == 0) {
          this.createOrder.FreightCharge = '';
        }
      }
    }
    addZero(type) {
      if(type == 'discount') {
        if(this.createOrder.discount == '') {
          this.createOrder.discount = 0;
        }
      } else if(type == 'frieght') {
        if(this.createOrder.FreightCharge == '') {
          this.createOrder.FreightCharge = 0;
        }
      }
    }
}