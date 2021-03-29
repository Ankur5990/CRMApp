import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../../shared/user.service';
import { GenericSort } from '../../../shared/pipes/generic-sort.pipe';
import { CacheService } from '../../../shared/cache.service';
import * as _ from 'lodash';
import { isNgTemplate } from '@angular/compiler';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { GRNService } from '../grn.service';

@Component({
  selector: 'app-create-grn',
  templateUrl: './create-grn.component.html',
  styleUrls: ['./create-grn.component.scss']
})
export class CreateGRNComponent implements OnInit {
  showLoader = false;
  cardTitle = 'CREATE GRN';
  isViewOnly = false;
  isEditOnly = false;
  createGrn;
  allVendors = [];
  allWarehouse = [];
  allProducts = [];
  selectedProduct = [];
  allSize = [];
  totalProducts = [];
  totalSize = [];
  userID = '';
  GrnID = 0;
  ProductId;
  todaysDate;
  lotNoValue = '';
  lotNoKey = '';
  showDelete = false;
  notHavingSize = false;
  searching = false;
  showList = false;
  detailPage = false;
  lotNoLists = [];
  searchKey = '';
  searchLotNo$ = new Subject<string>();
  constructor(protected userService: UserService, private grnService: GRNService,
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
      this.createGrn = this.grnService.getGrnObject();
      this.createGrn = JSON.parse(JSON.stringify(this.createGrn));
      this.createGrn.GrnDate = this.todaysDate;
      this.createGrn.GrnNumber = '';
      this.createGrn.SourceID = 2;
      this.createGrn.LotID = 0;
      this.createGrn.WareHouseID = 0;
      this.createGrn.VendorID = 0;
      this.createGrn.IsReverse = false;
      this.createGrn.Remark = '';
      this.getMasterData();
      this.getAllProducts();
      const activatedRouteObject = this.activatedRoute.snapshot.data;
      if(activatedRouteObject['viewMode'] === true) {
        this.isViewOnly = true;
        this.cardTitle = 'VIEW GRN'
        const grnId = this.activatedRoute.snapshot.params.grnId;
        this.GrnID = grnId;
        this.getDetails(grnId);
      } else if(activatedRouteObject['editMode'] === true) {
        this.isEditOnly = true;
        this.cardTitle = 'EDIT GRN'
        const grnId = this.activatedRoute.snapshot.params.grnId;
        this.GrnID = grnId;
        this.getDetails(grnId);
      }
      if(!(this.isEditOnly || this.isViewOnly)) {
        this.selectedProduct.push({});
      }
      this.displayDeleteIcon();
      this.grnService.search(this.searchLotNo$,this.userID)
      .subscribe(results => {
        this.showList = true;
        if(results['GRNLotList']) {
          this.lotNoLists = results['GRNLotList']
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
      this.grnService.getMasterData(this.userID).subscribe(res => {
        this.showLoader = false;
        let lookUpData = JSON.parse(JSON.stringify(res));
        this.allVendors = lookUpData.Vendor;
        this.allWarehouse = lookUpData.Warehouse;
      },(error)=> {
        this.showLoader = false;
        this.notification.error('Error','Error While Lookup Master Data');
      })
    }
    getAllProducts() {
      this.grnService.getAllProducts(this.userID).subscribe(res => {
        this.totalProducts = res['Product'];
        this.filterItems();
        this.allSize = JSON.parse(JSON.stringify(res['ProductSize']));
        if(this.notHavingSize == true && (this.isEditOnly || this.isViewOnly)) {
          this.pushExtraSize();
        }
      }, err=> {
        console.log(err);
      })
    }

    filterItems() {
      if(this.createGrn.SourceID ==2 && this.createGrn.LotID > 0) {
        this.allProducts = this.totalProducts.filter(x=> x.LotID == this.createGrn.LotID);
      } else {
        this.allProducts = JSON.parse(JSON.stringify(this.totalProducts));
      }
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
      this.grnService.getGrnDetails(id,this.userID).subscribe(res => {
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
      if(resp.GRN.length > 0) {
        let allValues = resp.GRN[0];
        let grnDateArray = allValues.GoodReceiveDate.split('/');
        this.createGrn.GrnDate = { year: +grnDateArray[2], month: +grnDateArray[0], day: +grnDateArray[1] };
        this.createGrn.GrnNumber = allValues.GoodReceiveNo;
        this.createGrn.SourceID = allValues.SourceID;
        this.createGrn.LotID = allValues.LOTNumber;
        this.createGrn.WareHouseID = allValues.WareHouseID;
        this.createGrn.VendorID = allValues.VendorID;
        this.createGrn.IsReverse = allValues.IsReverse;
        this.createGrn.Remark = allValues.Remark;
        this.lotNoValue = allValues.SortNO;
      }
      if(resp.GRNDetail.length > 0) {
        let allProductDetails = resp.GRNDetail;
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
          if(this.createGrn.LotID > 0) {
            this.filterItems();
          }
        } else {
          this.notHavingSize = true;
        }
      }
    }

    refreshDataHandler() {
      this.selectedProduct = [];
      this.selectedProduct.push({});
      this.createGrn.LotID = 0;
      this.lotNoKey = '';
      if(this.totalProducts.length > 0) {
        this.filterItems();
      }
    }

    validateData() {
      if((this.createGrn.LotID > 0 || this.createGrn.SourceID)
        && this.createGrn.VendorID > 0 && this.createGrn.WareHouseID >0 && this.validateProducts()) {
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
      if (this.cacheService.has("allGrnList")) {
        this.cacheService.set("backToGrnList", 'back');
      }
      this.router.navigate(['/pages/grn/list']);
    }
    submitGrn() {
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
        "GoodReceiveHeaderID": this.GrnID,
        "GoodReceiveDate": `${this.createGrn.GrnDate.month}/${this.createGrn.GrnDate.day}/${this.createGrn.GrnDate.year}`,
        "SourceID": this.createGrn.SourceID,
        "LOTNumber": this.createGrn.LotID,
        "WareHouseID": this.createGrn.WareHouseID,
        "VendorID": this.createGrn.VendorID,
        "Remark": this.createGrn.Remark,
        "IsReverse": this.createGrn.IsReverse,
        "CreatedBy": this.userID,
        "GRNDetail": productDetails
      }
      this.showLoader = true;
      this.grnService.createGrn(postData).subscribe(res => {
        this.showLoader = false;
        const resp = JSON.parse(JSON.stringify(res));
        if(resp.Error[0].ERROR == 0) {
          if (this.cacheService.has("allGrnList")) {
            this.cacheService.set("redirectAfterGrnSave", 'grnsaved');
            if (this.cacheService.has("grnListFilterData")) {
              this.cacheService.get("grnListFilterData").subscribe((res) => {
                let resp = JSON.parse(JSON.stringify(res));
                resp.SourceID = 1;
                resp.VendorID = 1;
                resp.WareHouseID = 1;
                resp.startDate = this.createGrn.GrnDate;
                resp.endDate = this.createGrn.GrnDate;
                this.cacheService.set("grnListFilterData", resp);
              });
            }
          }
          this.notification.success('Success', resp.Error[0].Msg);
          this.router.navigate(['pages/grn/list']);
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
    lotNoSelected(item) {
      this.showList = false;
      this.lotNoLists = [];
      this.lotNoKey = `${item.SortNO}`;
      this.createGrn.LotID = item.LOTNumber;
      if(this.totalProducts.length > 0) {
        this.filterItems();
      }
    }
}