import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { UserService } from '../../../shared/user.service';
import { GenericSort } from '../../../shared/pipes/generic-sort.pipe';
import { CacheService } from '../../../shared/cache.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { QuotationService } from '../quotation.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-create-quotation',
  templateUrl: './create-quotation.component.html',
  styleUrls: ['./create-quotation.component.scss']
})
export class CreateQuotationComponent implements OnInit {
  showLoader = false;
  cardTitle = 'CREATE QUOTATION';
  isViewOnly = false;
  isEditOnly = false;
  createQuotation;
  allQuotationTypes = [];
  allCustomerList = [];
  allProducts = [];
  selectedProduct = [];
  allCompany = [];
  allSize = [];
  allWareHouse = [];
  totalProducts = [];
  userID = '';
  QuotationID = 0;
  ProductId;
  todaysDate;
  rate = 0;
  discountedValue = 0;
  totalAmount = 0;
  finalAmount = 0;
  showDelete = false;
  disableOthers: Boolean = false;
  customerNameWithAddress = '';
  notHavingSize = false;
  searching = false;
  showList = false;
  customerList = [];
  searchKey = '';
  searchCustomer$ = new Subject<string>();
  disableOnDetails = false;
  isWarning = 0;
  constructor(protected userService: UserService, private quotationService: QuotationService,
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
      this.createQuotation = this.quotationService.getQuotationObject();
      this.createQuotation = JSON.parse(JSON.stringify(this.createQuotation));
      this.createQuotation.QuotationDate = this.todaysDate;
      this.createQuotation.QuotationType = 2;
      this.refreshDataHandler('typeChange');
      this.createQuotation.WarehouseID = 0;
      this.createQuotation.CustomerId = 0;
      this.createQuotation.Company = 1;
      this.createQuotation.discount = 0;
      this.createQuotation.FreightCharge = 0;
      this.createQuotation.Remarks = '';
      this.getMasterData();
      this.getImsMasterData();
      this.getAllProducts();
      const activatedRouteObject = this.activatedRoute.snapshot.data;
      if(activatedRouteObject['viewMode'] === true) {
        this.isViewOnly = true;
        this.disableOnDetails = true;
        this.cardTitle = 'VIEW QUOTATION'
        const quotationId = this.activatedRoute.snapshot.params.quotationId;
        this.QuotationID = quotationId;
        this.getDetails(quotationId);
      } else if(activatedRouteObject['editMode'] === true) {
        this.isEditOnly = true;
        this.disableOnDetails = true;
        this.cardTitle = 'EDIT QUOTATION'
        const quotationId = this.activatedRoute.snapshot.params.quotationId;
        this.QuotationID = quotationId;
        this.getDetails(quotationId);
      }
      if(!(this.isEditOnly || this.isViewOnly)) {
        this.selectedProduct.push({});
      }
      this.displayDeleteIcon();
      this.quotationService.search(this.searchCustomer$,this.userID)
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
      this.quotationService.getMasterData().subscribe(res => {
        this.showLoader = false;
        let lookUpData = JSON.parse(JSON.stringify(res));
        this.allCompany = lookUpData.Company;
      },(error)=> {
        this.showLoader = false;
        this.notification.error('Error','Error While Lookup Master Data');
      })
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
    onWarehouseChange() {
      this.filterProducts();
    }
    getAllProducts() {
      const id = 0
      this.quotationService.getAllProducts().subscribe(res => {
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
      if(this.createQuotation.WarehouseID > 0) {
        this.allProducts = this.totalProducts.filter(x => x.WarehouseID == this.createQuotation.WarehouseID);
      } else {
        this.allProducts = JSON.parse(JSON.stringify(this.totalProducts));
      }
    }

    pushExtraSize() {
      for(let i=0; i< this.selectedProduct.length; i++) {
        const allsize = JSON.parse(JSON.stringify(this.allSize));
        const availableSize = allsize.filter(x => x.PRODUCTID == this.selectedProduct[i].PRODUCTID.PRODUCTID && x.WarehouseID == this.createQuotation.WarehouseID);
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
      const availableSize = allsize.filter(x => x.PRODUCTID == e.item.PRODUCTID && x.WarehouseID == this.createQuotation.WarehouseID);
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
      this.discountedValue = (this.totalAmount * this.createQuotation.discount)/100;
      this.finalAmount = this.totalAmount + (+this.createQuotation.FreightCharge) - this.discountedValue;
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
      this.quotationService.getQuotationDetails(id,this.userID).subscribe(res => {
        this.showLoader = false;
        const resp = JSON.parse(JSON.stringify(res));
        this.populateAllData(resp);
      },(err) => {
        this.showLoader = false;
      })
    }

    populateAllData(resp) {
      if(resp.Quotation.length > 0) {
        let allValues = resp.Quotation[0];
        let quotationDateArray = allValues.QuotationDate.split('/');
        this.createQuotation.QuotationType = allValues.QuotationTypeID;
        this.customerNameWithAddress = `${allValues.CustomerName}, ${allValues.Address}`;
        this.createQuotation.WarehouseID = allValues.WarehouseID;
        this.createQuotation.CustomerId = allValues.LeadID == 0 ? allValues.CustomerID : allValues.LeadID;
        this.createQuotation.Company = allValues.CompanyID;
        this.createQuotation.discount = allValues.DiscountPercentage;
        this.createQuotation.FreightCharge = allValues.FreightAmount;
        this.createQuotation.QuotationDate = { year: +quotationDateArray[2], month: +quotationDateArray[0], day: +quotationDateArray[1] };
        this.createQuotation.Remarks = allValues.Remark;
        this.refreshDataHandler('typeChange');
      }
      if(resp.QuotationDetail.length > 0) {
        let allProductDetails = resp.QuotationDetail;
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
        sessionStorage.setItem('type', this.createQuotation.QuotationType);
      }
    }

    validateData() {
      if(this.createQuotation.CustomerId != 0 
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
      if (this.cacheService.has("allQuotationsList")) {
        this.cacheService.set("backToQuotationList", 'back');
      }
      this.router.navigate(['/pages/quotation/list']);
    }
    submitQuotation(action) {
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
      let postData = {
        "Action": action,
        "QuotationID": this.QuotationID,
        "QuotationDate": `${this.createQuotation.QuotationDate.month}/${this.createQuotation.QuotationDate.day}/${this.createQuotation.QuotationDate.year}`,
        "QuotationTypeID": this.createQuotation.QuotationType,
        "LeadID": this.createQuotation.QuotationType == 2 ? this.createQuotation.CustomerId : 0,
        "CustomerID": this.createQuotation.QuotationType == 3 ? this.createQuotation.CustomerId : 0,
        "DiscountPercentage": this.createQuotation.discount,
        "FreightAmount": this.createQuotation.FreightCharge,
        "CompanyID": this.createQuotation.Company,
        "CreatedBy": this.userID,
        "TotalAmount": this.finalAmount,
        "WarehouseID": this.createQuotation.WarehouseID,
        "Remarks": this.createQuotation.Remarks,
        "QuotationDetail": productDetails,
        "IsWarningAllowed": this.isWarning
      }
      this.showLoader = true;
      this.quotationService.createQuotation(postData).subscribe(res => {
        this.showLoader = false;
        const resp = JSON.parse(JSON.stringify(res));
        if(resp.Error[0].ERROR == 0) {
          if(resp.Error[0].IsWarningAllowed == 1) {
            this.showWarningPopUp(resp.Error[0].Msg);
            return;
          } else {
            this.isWarning = 0;
          }
          if (this.cacheService.has("allQuotationsList")) {
            this.cacheService.set("redirectAfterQuotationSave", 'quotationsaved');
            if (this.cacheService.has("quotationListFilterData")) {
              this.cacheService.get("quotationListFilterData").subscribe((res) => {
                let resp = JSON.parse(JSON.stringify(res));
                resp.QuotationType = 1;
                resp.WareHouseID = 1;
                resp.startDate = this.createQuotation.QuotationDate;
                resp.endDate = this.createQuotation.QuotationDate;
                this.cacheService.set("quotationListFilterData", resp);
              });
            }
          }
          if(resp.Error[0].SMSAPI && resp.Error[0].SMSAPI !='') {
            let textValue = encodeURI(resp.Error[0].SMSTEXT);
            let messageUrl = resp.Error[0].SMSAPI.replace('MSGTEXT', textValue);
            this.quotationService.sendSMS(messageUrl).subscribe(res => {
              console.log(res);
            })
          }
          this.notification.success('Success', resp.Error[0].Msg);
          setTimeout(()=> {
            this.router.navigate(['pages/quotation/list']);
          },0);
        } else {
          this.notification.error('Error', resp.Error[0].Msg);
        }
      }, err => {
        this.showLoader = false;
        this.notification.error('Error', 'Something went wrong!');
      })
    }
    removeZero(type) {
      if(type == 'discount') {
        if(this.createQuotation.discount == 0) {
          this.createQuotation.discount = '';
        }
      } else if(type == 'frieght') {
        if(this.createQuotation.FreightCharge == 0) {
          this.createQuotation.FreightCharge = '';
        }
      }
    }
    addZero(type) {
      if(type == 'discount') {
        if(this.createQuotation.discount == '') {
          this.createQuotation.discount = 0;
        }
      } else if(type == 'frieght') {
        if(this.createQuotation.FreightCharge == '') {
          this.createQuotation.FreightCharge = 0;
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
      this.createQuotation.CustomerId = item.ID;
    }
    showWarningPopUp(msg) {
      const activeModal = this.modalService.open(ModalComponent, {
        size: 'sm',
        backdrop: 'static',
      });
      activeModal.componentInstance.BUTTONS.OK = 'Continue';
      activeModal.componentInstance.BUTTONS.Cancel = 'Cancel';
      activeModal.componentInstance.showCancel = true;
      activeModal.componentInstance.modalHeader = 'Warning!';
      activeModal.componentInstance.modalContent = `${msg}.`;
      activeModal.componentInstance.closeModalHandler = (() => {
        this.isWarning = 1;
        this.submitQuotation('save');
      });
      activeModal.componentInstance.dismissHandler = (() => {
        this.isWarning = 0;
      });
    }
}