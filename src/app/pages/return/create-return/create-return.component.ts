import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { UserService } from '../../../shared/user.service';
import { CacheService } from '../../../shared/cache.service';
import { ReturnService } from '../return.service';

@Component({
  selector: 'app-create-return',
  templateUrl: './create-return.component.html',
  styleUrls: ['./create-return.component.scss']
})
export class CreateReturnComponent implements OnInit {
  showLoader = false;
  cardTitle = 'Create Return';
  isViewOnly = false;
  isEditOnly = false;
  createReturn;
  allVendors = [];
  allWarehouse = [];
  allReturnType = [];
  allProducts = [];
  selectedProduct = [];
  allSize = [];
  customerList = [];
  userID = '';
  ReturnID = 0;
  todaysDate;
  CustomerValue = '';
  CustomerKey = '';
  showDelete = false;
  notHavingSize = false;
  showList = false;
  detailPage = false;
  searchCustomer$ = new Subject<string>();
  constructor(protected userService: UserService, private returnService: ReturnService,
    private router: Router, private activatedRoute: ActivatedRoute,
    protected cacheService: CacheService, private notification: NotificationsService) { }
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
      this.createReturn = this.returnService.getReturnObject();
      this.createReturn = JSON.parse(JSON.stringify(this.createReturn));
      this.createReturn.ReturnDate = this.todaysDate;
      this.createReturn.ReturnNumber = '';
      this.createReturn.CustomerID = 0;
      this.createReturn.WareHouseID = 0;
      this.createReturn.VendorID = 0;
      this.createReturn.ReturnType = 0;
      this.createReturn.Remark = '';
      this.getMasterData();
      this.getAllProducts();
      const activatedRouteObject = this.activatedRoute.snapshot.data;
      if(activatedRouteObject['viewMode'] === true) {
        this.isViewOnly = true;
        this.cardTitle = 'VIEW Return'
        const returnId = this.activatedRoute.snapshot.params.returnId;
        this.ReturnID = returnId;
        this.getDetails(returnId);
      } else if(activatedRouteObject['editMode'] === true) {
        this.isEditOnly = true;
        this.cardTitle = 'EDIT Return'
        const returnId = this.activatedRoute.snapshot.params.returnId;
        this.ReturnID = returnId;
        this.getDetails(returnId);
      }
      if(!(this.isEditOnly || this.isViewOnly)) {
        this.selectedProduct.push({});
      }
      this.displayDeleteIcon();
      this.returnService.search(this.searchCustomer$,this.userID)
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
      this.returnService.getMasterData(this.userID).subscribe(res => {
        this.showLoader = false;
        let lookUpData = JSON.parse(JSON.stringify(res));
        this.allVendors = lookUpData.Vendor;
        this.allWarehouse = lookUpData.Warehouse;
        this.allReturnType = lookUpData.ReturnType;
      },(error)=> {
        this.showLoader = false;
        this.notification.error('Error','Error While Lookup Master Data');
      })
    }
    getAllProducts() {
      this.returnService.getAllProducts(this.userID).subscribe(res => {
        this.allProducts = JSON.parse(JSON.stringify(res['Product']));
        this.allSize = JSON.parse(JSON.stringify(res['ProductSize']));
        if(this.notHavingSize == true && (this.isEditOnly || this.isViewOnly)) {
          this.pushExtraSize();
        }
      }, err=> {
        console.log(err);
      })
    }

    pushExtraSize() {
      for(let i=0; i< this.selectedProduct.length; i++) {
        const allsize = JSON.parse(JSON.stringify(this.allSize));
        const availableSize = allsize.filter(x => x.PRODUCTID == this.selectedProduct[i].PRODUCTID.PRODUCTID);
          for(let j=0; j< availableSize.length; j++) {
            let flag = true;
            for(let k=0; k< this.selectedProduct[i].ProductAvailableSize.length; k++) {
              if(this.selectedProduct[i].ProductAvailableSize[k].SizeID == availableSize[j].SizeID) {
                flag = false;
                break;
              }
            }
            if(flag == true) {
              this.selectedProduct[i].ProductAvailableSize.push({PRODUCTID: availableSize[j].PRODUCTID,name:availableSize[j].Size,INVBalance: availableSize[i].INVBalance,Size: availableSize[j].Size, SizeID: availableSize[j].SizeID,alreadySizeStored: false, quantity: 0})
            }
          }

        }
    }

    onProductChange(e, row) {
      const allsize = JSON.parse(JSON.stringify(this.allSize));
      const availableSize = allsize.filter(x => x.PRODUCTID == e.item.PRODUCTID);
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
        sizeQuantity.push({ProductId: availableSize[i].PRODUCTID, name: availableSize[i].Size, SizeID: availableSize[i].SizeID , quantity: 0});
      }
      for(let i=0; i<this.allProducts.length; i++) {
          if(this.allProducts[i].PRODUCTID == e.item.PRODUCTID) {
            row.ProductAvailableSize = sizeQuantity;
          }
      } 
    }
    addProductRow() {
      this.selectedProduct.push({ProductAvailableSize:[]});
    }

    onDelete(i) {
      this.selectedProduct.splice(i,1);
    }
  
    getDetails(id) {
      this.showLoader = true;
      this.returnService.getReturnDetails(id,this.userID).subscribe(res => {
        this.detailPage = true
        this.showLoader = false;
        const resp = JSON.parse(JSON.stringify(res));
        this.populateAllData(resp);
      },(err) => {
        this.showLoader = false;
        this.goToListPage();
      })
    }
    populateAllData(resp) {
      if(resp.Return.length > 0) {
        let allValues = resp.Return[0];
        let returnDateArray = allValues.GoodReturnDate.split('/');
        this.createReturn.ReturnDate = { year: +returnDateArray[2], month: +returnDateArray[0], day: +returnDateArray[1] };
        this.createReturn.ReturnNumber = allValues.GoodReturnNo;
        this.createReturn.CustomerID = allValues.GoodReturnCompanyID;
        this.createReturn.WareHouseID = allValues.WareHouseID;
        this.createReturn.VendorID = allValues.VendorID;
        this.createReturn.ReturnType = allValues.GoodReturnTypeID;
        this.createReturn.Remark = allValues.RMAB_Description;
        this.CustomerValue = allValues.Customer;
      }
      if(resp.ReturnDetail.length > 0) {
        let allProductDetails = resp.ReturnDetail;
        let sizeQuantityArray = []
        let j = 0;
        for(let i=0; i< allProductDetails.length; i++) {
          if(j == 0) {
            this.selectedProduct.push({PRODUCTID: {PRODUCTID: allProductDetails[i].PRODUCTID},
              ProductAvailableSize: [],
              ProductName: `${allProductDetails[i].PRODUCTCODE} - ${allProductDetails[i].PRODUCTDESC}`,
              SizeValue: allProductDetails[i].Size,
              alreadyStored: true})
              this.selectedProduct[j].ProductAvailableSize.push(
                {PRODUCTID: allProductDetails[i].PRODUCTID, name:allProductDetails[i].Size, Size: allProductDetails[i].Size, SizeID: allProductDetails[i].SizeID, alreadySizeStored: true, quantity: allProductDetails[i].Quantity});
              j++;
          } else if( j!= 0 && allProductDetails[i].PRODUCTID != this.selectedProduct[j-1].PRODUCTID.PRODUCTID) {
            this.selectedProduct.push({PRODUCTID: {PRODUCTID: allProductDetails[i].PRODUCTID},
              ProductAvailableSize: [],
              ProductName: `${allProductDetails[i].PRODUCTCODE} - ${allProductDetails[i].PRODUCTDESC}`,
              SizeValue: allProductDetails[i].Size,
              alreadyStored: true})
              this.selectedProduct[j].ProductAvailableSize.push({PRODUCTID: allProductDetails[i].PRODUCTID, name:allProductDetails[i].Size, Size: allProductDetails[i].Size, SizeID: allProductDetails[i].SizeID,alreadySizeStored: true, quantity: allProductDetails[i].Quantity});
              j++;
          } else if (j!= 0 && allProductDetails[i].PRODUCTID == this.selectedProduct[j-1].PRODUCTID.PRODUCTID) {
            this.selectedProduct[j-1].ProductAvailableSize.push({PRODUCTID: allProductDetails[i].PRODUCTID, name:allProductDetails[i].Size, Size: allProductDetails[i].Size, SizeID: allProductDetails[i].SizeID,alreadySizeStored: true, quantity: allProductDetails[i].Quantity});
          }
        }
        if(this.allSize.length > 0) {
          this.pushExtraSize();
        } else {
          this.notHavingSize = true;
        }
      }
    }

    refreshDataHandler() {
      this.selectedProduct = [];
      this.selectedProduct.push({});
    }

    validateData() {
      if(this.createReturn.CustomerID > 0
        && this.createReturn.ReturnType > 0 && this.createReturn.VendorID > 0 && this.createReturn.WareHouseID > 0 && this.validateProducts()) {
          return true;
        }
      return false;
    }
    validateProducts() {
      let flag = true;
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
      if (this.cacheService.has("allReturnsList")) {
        this.cacheService.set("backToReturnList", 'back');
      }
      this.router.navigate(['/pages/return/list']);
    }
    submitReturn() {
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
              Quantity: this.selectedProduct[i].ProductAvailableSize[j].quantity
            })
          }
        }
      }
      let postData = {
        "GoodReturnHeaderID": this.ReturnID,
        "GoodReturnDate": `${this.createReturn.ReturnDate.month}/${this.createReturn.ReturnDate.day}/${this.createReturn.ReturnDate.year}`,
        "GoodReturnCompanyID": this.createReturn.CustomerID,
        "GoodReturnTypeID": this.createReturn.ReturnType,
        "WareHouseID": this.createReturn.WareHouseID,
        "VendorID": this.createReturn.VendorID,
        "RMAB_Description": this.createReturn.Remark,
        "CreatedBy": this.userID,
        "ReturnDetail": productDetails
      }
      this.showLoader = true;
      this.returnService.createReturn(postData).subscribe(res => {
        this.showLoader = false;
        const resp = JSON.parse(JSON.stringify(res));
        if(resp.Error[0].ERROR == 0) {
          if (this.cacheService.has("allReturnsList")) {
            this.cacheService.set("redirectAfterReturnSave", 'returnsaved');
            if (this.cacheService.has("returnListFilterData")) {
              this.cacheService.get("returnListFilterData").subscribe((res) => {
                let resp = JSON.parse(JSON.stringify(res));
                resp.ReturnType = 1;
                resp.VendorID = 1;
                resp.WareHouseID = 1;
                resp.startDate = this.createReturn.ReturnDate;
                resp.endDate = this.createReturn.ReturnDate;
                this.cacheService.set("returnListFilterData", resp);
              });
            }
          }
          this.notification.success('Success', resp.Error[0].Msg);
          this.router.navigate(['pages/return/list']);
        } else {
          this.notification.error('Error', resp.Error[0].Msg);
        }
      }, err => {
        this.showLoader = false;
        this.notification.error('Error', 'Something went wrong!');
      })
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
      this.CustomerKey = `${item.CustomerName},${item.Address}`;
      this.createReturn.CustomerID = item.ID;
    }
}