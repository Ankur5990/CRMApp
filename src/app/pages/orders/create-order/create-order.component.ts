import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OrderService } from '../orders.service';
import { UserService } from '../../../shared/user.service';
import { GenericSort } from '../../../shared/pipes/generic-sort.pipe';
import { CacheService } from '../../../shared/cache.service';
import * as _ from 'lodash';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

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
  allWareHouse = [];
  // allVendors = [];
  totalProducts = [];
  userID = '';
  OrderID = 0;
  ProductId;
  todaysDate;
  rate = 0;
  discountedValue = 0;
  totalAmount = 0;
  finalAmount = 0;
  showDelete = false;
  detailPage: Boolean = false;
  disablePayment: Boolean = false;
  disableStatus: Boolean = false;
  disableOthers: Boolean = false;
  disableAmount: Boolean = false;
  IsApprove: Boolean = false;
  disableTransporter: Boolean = false;
  showOtherCustomer: Boolean = false;
  statusId;
  customerNameWithAddress = '';
  notHavingSize = false;
  enableVoidOrder = false;
  leadAlreadySelected = false;
  searching = false;
  showList = false;
  customerList = [];
  searchKey = '';
  searchCustomer$ = new Subject<string>();
  disableLeadCustomer = false;
  constructor(protected userService: UserService, private orderService: OrderService,
    private router: Router, private activatedRoute: ActivatedRoute,
    protected cacheService: CacheService, protected modalService: NgbModal,
    private notification: NotificationsService, private genericSort: GenericSort) { }
    inputFormatter = (res => {
      if(res){
        return `${res.Product}`;
      }
    });
    searchProduct = (text$: Observable<any>) => {
      var self = this; return text$.pipe(debounceTime(200),
        distinctUntilChanged(),
        map(term => {
          return self.allProducts && self.allProducts.filter((v: any) => {
            term = term.trim();
            const flag = v.Product.toLowerCase().indexOf(term.toLowerCase()) > -1;
            return flag;
          }).slice(0, 12);
        }),)
    };
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
      this.createOrder.WarehouseID = 0;
      this.createOrder.PaymentId = 0;
      this.createOrder.CustomerId = 0;
      this.createOrder.DispatchNo = '';
      this.createOrder.discount = 0;
      this.createOrder.FreightCharge = 0;
      this.createOrder.Transporter = 0;
      this.createOrder.InvoiceNo = '';
      this.createOrder.BillingAddress = '';
      this.createOrder.GSTNo = '';
      this.createOrder.MembershipNo = '';
      this.createOrder.TaxInvoice = false;
      this.createOrder.Company = 1;
      this.createOrder.CashAmount = '';
      this.createOrder.ChequeAmount = '';
      this.createOrder.OtherAmount = '';
      this.createOrder.Remark = '';
      this.disablePayment = true;
      this.disableStatus = true;
      this.disableAmount = true;
      this.disableTransporter = true;
      this.getMasterData();
      this.getImsMasterData();
      this.getAllProducts();
      const id = this.activatedRoute.snapshot.queryParams.id;
      if(id) {
        this.leadAlreadySelected = true;
        this.createOrder.CustomerId = id;
        this.customerNameWithAddress = this.activatedRoute.snapshot.queryParams.customer;
      }
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
      this.orderService.search(this.searchCustomer$,this.userID)
      .subscribe(results => {
        this.showList = true;
        if(results['Customer']) {
          this.customerList = results['Customer']
        }
      });
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

    getImsMasterData() {
      this.showLoader = true;
      this.orderService.getImsMasterData(this.userID).subscribe(resp =>{
        this.showLoader = false;
        let imsMasterData = JSON.parse(JSON.stringify(resp));
        // this.allVendors = imsMasterData.Vendor;
        this.allWareHouse = imsMasterData.Warehouse;
      }, error => {
        this.showLoader = false;
        this.notification.error('Error', 'Error while IMS master data');
      })
    }
    onVendorWarehouseChange() {
      this.filterProducts();
    }
    getAllProducts() {
      const id = 0
      this.orderService.getAllProducts().subscribe(res => {
        this.totalProducts = res['Product'];
        this.filterProducts();
        //this.allProducts = res['Product'];
        this.allSize = res['ProductSize'];
        if(this.notHavingSize == true && (this.isEditOnly || this.isViewOnly)){
          this.pushExtraSize();
        }
      }, err=> {
        console.log(err);
        this.goToListPage();
      })
    }

    filterProducts() {
      if(this.createOrder.WarehouseID > 0) {
        this.allProducts = this.totalProducts.filter(x => x.WarehouseID == this.createOrder.WarehouseID);
      } else {
        this.allProducts = JSON.parse(JSON.stringify(this.totalProducts));
      }
    }
    pushExtraSize() {
      for(let i=0; i< this.selectedProduct.length; i++) {
        const allsize = JSON.parse(JSON.stringify(this.allSize));
        const availableSize = allsize.filter(x => x.PRODUCTID == this.selectedProduct[i].PRODUCTID.PRODUCTID && x.WarehouseID == this.createOrder.WarehouseID);
          for(let j=0; j< availableSize.length; j++) {
            let flag = true;
            for(let k=0; k< this.selectedProduct[i].ProductAvailableSize.length; k++) {
              if(this.selectedProduct[i].ProductAvailableSize[k].SizeID == availableSize[j].SizeID) {
                flag = false;
                break;
              }
            }
            if(flag == true) {
              this.selectedProduct[i].ProductAvailableSize.push({PRODUCTID: availableSize[j].PRODUCTID,name:availableSize[j].Size,INVBalance: availableSize[j].INVBalance,Size: availableSize[j].Size, SizeID: availableSize[j].SizeID,alreadySizeStored: false, quantity: 0})
            }
          }

        }
    }
    onProductChange(e, row) {
      const allsize = JSON.parse(JSON.stringify(this.allSize));
      const availableSize = allsize.filter(x => x.PRODUCTID == e.item.PRODUCTID && x.WarehouseID == this.createOrder.WarehouseID);
      let sizeQuantity = [];
      if(row.isError) {
        row.isError = false;
      }
      if(this.selectedProduct.length > 0) {
        let len = 0;
        for(let i=0; i< this.selectedProduct.length; i++) {
          if(this.selectedProduct[i].PRODUCTID) {
            if(this.selectedProduct[i].PRODUCTID.PRODUCTID == e.item.PRODUCTID) {
              len++;
            }
          }
        }
        if(len > 0) {
          this.notification.error('error', 'Can not select same product again !!!');
          e.item.PRODUCTID = '';
          e.item.Product = '';
          return;
        }
      }
      for(let i=0; i<availableSize.length; i++) {
        sizeQuantity.push({ProductId: availableSize[i].PRODUCTID,INVBalance: availableSize[i].INVBalance, name: availableSize[i].Size, SizeID: availableSize[i].SizeID , quantity: 0});
      }
      for(let i=0; i<this.allProducts.length; i++) {
          if(this.allProducts[i].PRODUCTID == e.item.PRODUCTID) {
            row.Rate = this.allProducts[i].Rate;
            row.ProductAvailableSize = sizeQuantity;
          }
      } 
    }
    addProductRow() {
      this.selectedProduct.push({ProductAvailableSize:[]});
    }
    changeAmount(item) {
      let amount = 0;
      if(item.ProductAvailableSize) {
        for(let i=0; i< item.ProductAvailableSize.length; i++) {
          if(!item.ProductAvailableSize[i].quantity) {
            amount = amount + 0;
          } else {
            amount = amount + (+item.ProductAvailableSize[i].quantity * +item.Rate);
          }
        }
      }
      item.Amount = amount;
      this.calculateTotals();
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
      this.detailPage = true;
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
        this.disableLeadCustomer = true;
        let allValues = resp.Order[0];
        this.statusId = allValues.OrderStatusID;
        let orderDateArray = allValues.OrderDate.split('/');
        this.createOrder.OrderType = allValues.OrderTypeID;
        this.createOrder.OrderStatus = allValues.OrderStatusCode;
        this.IsApprove = allValues.IsApprove;
        if(allValues.OrderStatusCode == 'PD') {
          this.showOtherCustomer = true;
          this.disableTransporter = false;
          this.disablePayment = true;
          this.disableOthers = true;
        }
        if(allValues.OrderStatusCode == 'PPA') {
          this.disablePayment = true;
          this.disableAmount = false;
        }
        if(allValues.OrderStatusCode == 'PP' && this.isEditOnly == true) {
          this.enableVoidOrder = true;
        }
        this.createOrder.CashAmount = allValues.CashAmount;
        this.createOrder.ChequeAmount = allValues.CheckAmount;
        this.createOrder.OtherAmount = allValues.OtherAmount;
        this.createOrder.Remark = allValues.Remark;
        this.customerNameWithAddress = `${allValues.CustomerName}, ${allValues.Address}`;
        this.createOrder.WarehouseID = allValues.WarehouseID;
        this.createOrder.PaymentId = allValues.PaymentModeID;
        this.createOrder.CustomerId = allValues.LeadID == 0 ? allValues.CustomerID : allValues.LeadID;
        this.createOrder.DispatchNo = allValues.DispatchNo;
        this.createOrder.discount = allValues.DiscountPercentage;
        this.createOrder.FreightCharge = allValues.FreightAmount;
        this.createOrder.Transporter = allValues.TransporterID;
        this.createOrder.Company = allValues.CompanyID;
        this.createOrder.InvoiceNo = allValues.InvoiceNumber;
        this.createOrder.BillingAddress = allValues.BillingAddress;
        this.createOrder.GSTNo = allValues.GSTNO;
        this.createOrder.MembershipNo = allValues.MembershipNo;
        this.createOrder.TaxInvoice = allValues.IsTaxInvoice;
        this.createOrder.OrderDate = { year: +orderDateArray[2], month: +orderDateArray[0], day: +orderDateArray[1] };
        this.refreshDataHandler('typeChange');
      }
      if(resp.OrderDetail.length > 0) {
        let allProductDetails = resp.OrderDetail;
        let sizeQuantityArray = []
        let j = 0;
        for(let i=0; i< allProductDetails.length; i++) {
          if(j == 0) {
            this.selectedProduct.push({PRODUCTID: {PRODUCTID: allProductDetails[i].ProductID},
              ProductAvailableSize: [],
              Rate: allProductDetails[i].SP,
              Amount: 0,
              ProductName: `${allProductDetails[i].PRODUCTCODE} - ${allProductDetails[i].PRODUCTDESC}`,
              SizeValue: allProductDetails[i].Size,
              alreadyStored: true})
              this.selectedProduct[j].ProductAvailableSize.push({PRODUCTID: allProductDetails[i].ProductID,name:allProductDetails[i].Size,INVBalance: allProductDetails[i].INVBalance,Size: allProductDetails[i].Size, SizeID: allProductDetails[i].SizeID,alreadySizeStored: true, quantity: allProductDetails[i].Quantity});
              j++;
          } else if( j!= 0 && allProductDetails[i].ProductID != this.selectedProduct[j-1].PRODUCTID.PRODUCTID) {
            this.selectedProduct.push({PRODUCTID: {PRODUCTID: allProductDetails[i].ProductID},
              ProductAvailableSize: [],
              Rate: allProductDetails[i].SP,
              Amount: 0,
              ProductName: `${allProductDetails[i].PRODUCTCODE} - ${allProductDetails[i].PRODUCTDESC}`,
              SizeValue: allProductDetails[i].Size,
              alreadyStored: true})
              this.selectedProduct[j].ProductAvailableSize.push({PRODUCTID: allProductDetails[i].ProductID,name:allProductDetails[i].Size,INVBalance: allProductDetails[i].INVBalance,Size: allProductDetails[i].Size, SizeID: allProductDetails[i].SizeID,alreadySizeStored: true, quantity: allProductDetails[i].Quantity});
              j++;
          } else if (j!= 0 && allProductDetails[i].ProductID == this.selectedProduct[j-1].PRODUCTID.PRODUCTID) {
            this.selectedProduct[j-1].ProductAvailableSize.push({PRODUCTID: allProductDetails[i].ProductID,name:allProductDetails[i].Size,INVBalance: allProductDetails[i].INVBalance,Size: allProductDetails[i].Size, SizeID: allProductDetails[i].SizeID,alreadySizeStored: true, quantity: allProductDetails[i].Quantity});
          }
        }
        this.calculateAmount();
        if(this.allSize.length > 0) {
          this.filterProducts();
          this.pushExtraSize();
        } else {
          this.notHavingSize = true;
        }
      }
    }
    calculateAmount() {
      for(let i=0; i< this.selectedProduct.length; i++) {
        let amount = 0;
        for(let j=0; j< this.selectedProduct[i].ProductAvailableSize.length; j++) {
          amount = amount + (+this.selectedProduct[i].ProductAvailableSize[j].quantity * +this.selectedProduct[i].Rate);
        }
        this.selectedProduct[i].Amount = amount;
      }
      this.calculateTotals();
    }
    refreshDataHandler(byType: any = '') {
      if(byType === "typeChange") {
        this.showList = false;
        this.customerList = [];
        sessionStorage.setItem('type', this.createOrder.OrderType);
      } else if(byType =="paymentMode") {
        if(this.createOrder.PaymentId > 0) {
          this.disableAmount = false;
          this.createOrder.OrderStatus = "PPA";
        } else if(this.createOrder.PaymentId == 0) {
          this.createOrder.OrderStatus = "PP";
          this.disableAmount = true;
          this.createOrder.CashAmount = '';
          this.createOrder.ChequeAmount = '';
          this.createOrder.OtherAmount = '';
        }
      } else if(byType == "transporter") {
        if(this.createOrder.Transporter > 0) {
          this.createOrder.OrderStatus = "C";
        } else {
          this.createOrder.OrderStatus = "PD";
          this.createOrder.DispatchNo = '';
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
        if(this.selectedProduct[i].PRODUCTID && this.selectedProduct[i].PRODUCTID.PRODUCTID && this.selectedProduct[i].PRODUCTID.PRODUCTID !=0 ) {
          flag = true;
        } else {
          this.selectedProduct[i].isError = true;
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
      if (this.cacheService.has("allOrdersList")) {
        this.cacheService.set("backToOrderList", 'back');
      }
      this.router.navigate(['/pages/orders/list']);
    }
    submitOrder(action) {
      if(!this.validateData()) {
        this.notification.error('Error', 'Please fill all the mandatory information !!!')
        return;
      }
      let productDetails = [];
      for(let i=0; i<this.selectedProduct.length; i++) {
        for(let j=0; j<this.selectedProduct[i].ProductAvailableSize.length; j++) {
          if(this.selectedProduct[i].ProductAvailableSize[j].quantity && this.selectedProduct[i].ProductAvailableSize[j].quantity != 0) {
            productDetails.push({
              ProductID : this.selectedProduct[i].PRODUCTID.PRODUCTID,
              SizeID: this.selectedProduct[i].ProductAvailableSize[j].SizeID,
              Quantity: this.selectedProduct[i].ProductAvailableSize[j].quantity,
              Rate: this.selectedProduct[i].Rate
            })
          }
        }
      }
      let statusResult;
      if(action == 'approve') {
        statusResult = this.allStatus.find(x=> x.Code == 'PD');
      } else  {
        statusResult = this.allStatus.find(x=> x.Code == this.createOrder.OrderStatus);
      }
      let postData = {
        "Action": action,
        "OrderID": this.OrderID,
        "OrderDate": `${this.createOrder.OrderDate.month}/${this.createOrder.OrderDate.day}/${this.createOrder.OrderDate.year}`,
        "OrderTypeID": this.createOrder.OrderType,
        "LeadID": this.createOrder.OrderType == 2 ? this.createOrder.CustomerId : 0,
        "CustomerID": this.createOrder.OrderType == 3 ? this.createOrder.CustomerId : 0,
        "CompanyID": this.createOrder.Company,
        "WarehouseID": this.createOrder.WarehouseID,
        "DiscountPercentage": this.createOrder.discount,
        "OrderStatusID": statusResult.OrderStatusID,
        "PaymentModeID": this.createOrder.PaymentId,
        "DispatchNo": this.createOrder.DispatchNo,
        "TransporterID": this.createOrder.Transporter ? this.createOrder.Transporter : 0,
        "FreightAmount": this.createOrder.FreightCharge,
        "InvoiceNumber": this.createOrder.InvoiceNo ? this.createOrder.InvoiceNo : '',
        "BillingAddress": this.createOrder.BillingAddress ? this.createOrder.BillingAddress : '',
        "GSTNO": this.createOrder.GSTNo ? this.createOrder.GSTNo : '',
        "CashAmount": this.createOrder.CashAmount,
        "CheckAmount": this.createOrder.ChequeAmount,
        "OtherAmount": this.createOrder.OtherAmount,
        "MembershipNo": this.createOrder.MembershipNo ? this.createOrder.MembershipNo: '',
        "Remark": this.createOrder.Remark,
        "IsTaxInvoice": this.createOrder.TaxInvoice,
        "CreatedBy": this.userID,
        "TotalAmount": this.finalAmount,
        "OrderDetail": productDetails
      }
      this.showLoader = true;
      this.orderService.createOrder(postData).subscribe(res => {
        this.showLoader = false;
        const resp = JSON.parse(JSON.stringify(res));
        if(resp.Error[0].ERROR == 0) {
          if (this.cacheService.has("allOrdersList")) {
            this.cacheService.set("redirectAfterOrderSave", 'ordersaved');
            if (this.cacheService.has("orderListFilterData")) {
              this.cacheService.get("orderListFilterData").subscribe((res) => {
                let resp = JSON.parse(JSON.stringify(res));
                resp.OrderType = 1;
                resp.OrderStatus = 1;
                resp.startDate = this.createOrder.OrderDate;
                resp.endDate = this.createOrder.OrderDate;
                this.cacheService.set("orderListFilterData", resp);
              });
            }
          }
          if(resp.Error[0].SMSAPI && resp.Error[0].SMSAPI !='') {
            let textValue = encodeURI(resp.Error[0].SMSTEXT);
            let messageUrl = resp.Error[0].SMSAPI.replace('MSGTEXT', textValue);
            this.orderService.sendSMS(messageUrl).subscribe(res => {
              console.log(res);
            })
          }
          this.notification.success('Success', resp.Error[0].Msg);
          setTimeout(()=> {
            this.router.navigate(['pages/orders/list']);
          },0);
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
    removeRateZero(item) {
      if(item.Rate == 0) {
        item.Rate = '';
      }
    }
    addRateZero(item) {
      if(item.Rate == '') {
        item.Rate = 0;
      }
    }
    removeQuantityZero(quan) {
      if(quan.quantity == 0) {
        quan.quantity = '';
      }
    }
    addQuantityZero(quan) {
      if(quan.quantity == '') {
        quan.quantity = 0;
      }
    }
    customerSelected(item) {
      this.showList = false;
      this.customerList = [];
      this.searchKey = `${item.CustomerName}`;
      if(item.Address) {
        this.searchKey = this.searchKey + `,${item.Address}`;
      }
      this.createOrder.CustomerId = item.ID;
      this.createOrder.BillingAddress = item.BillingAddress;
      this.createOrder.GSTNo = item.GSTNO;
      this.createOrder.MembershipNo = item.MembershipNo;
    }
}
