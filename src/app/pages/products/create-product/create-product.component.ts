import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../../shared/user.service';
import { GenericSort } from '../../../shared/pipes/generic-sort.pipe';
import { CacheService } from '../../../shared/cache.service';
import * as _ from 'lodash';
import { ProductService } from '../product.service';

@Component({
  selector: 'app-create-product',
  templateUrl: './create-product.component.html',
  styleUrls: ['./create-product.component.scss']
})
export class CreateProductComponent implements OnInit {
  showLoader = false;
  cardTitle = 'Create New Product';
  isViewOnly = false;
  isEditOnly = false;
  createProduct;
  allProductType = [];
  allSources = [];
  allFit = [];
  allVarient = [];
  allCategory = [];
  allColor = [];
  userID = '';
  ProductID = 0;
  detail = false;
  errMessage = 'Please fill all the mandatory information !!!';

  constructor(protected userService: UserService, private productService: ProductService,
    private router: Router, private activatedRoute: ActivatedRoute,
    protected cacheService: CacheService, protected modalService: NgbModal,
    private notification: NotificationsService, private genericSort: GenericSort) { }

    ngOnInit() {
      this.userID = localStorage.getItem('UserLoginId');
      this.createProduct = this.productService.getProductObject();
      this.createProduct = JSON.parse(JSON.stringify(this.createProduct));
      this.createProduct.ProductCode = '';
      this.createProduct.ProductDesc = '';
      this.createProduct.Mrp = '';
      this.createProduct.CostPrice = '';
      this.createProduct.SalePrice = '';
      this.createProduct.SourceID = 0;
      this.createProduct.ProductTypeID = 0;
      this.createProduct.BarCode = '';
      this.createProduct.ColorID = 0;
      this.createProduct.GenderID = 0;
      this.createProduct.ProductCatogeryID = 0;
      this.createProduct.FitID = 0;
      this.createProduct.VarientID = 0;
      this.createProduct.Lot = '';
      this.createProduct.Remark = '';
      this.createProduct.IsActive = true;
      this.getMasterData();
      const activatedRouteObject = this.activatedRoute.snapshot.data;
      if(activatedRouteObject['viewMode'] === true) {
        this.isViewOnly = true;
        this.cardTitle = 'View Product'
        const productId = this.activatedRoute.snapshot.params.productId;
        this.ProductID = productId;
        this.getDetails(productId);
      } else if(activatedRouteObject['editMode'] === true) {
        this.isEditOnly = true;
        this.cardTitle = 'Edit Product'
        const productId = this.activatedRoute.snapshot.params.productId;
        this.ProductID = productId;
        this.getDetails(productId);
      }
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

    getDetails(id) {
      this.detail = true;
      this.showLoader = true;
      this.productService.getProductDetails(id,this.userID).subscribe(res => {
        this.showLoader = false;
        const resp = JSON.parse(JSON.stringify(res));
        this.populateAllData(resp);
      },(err) => {
        this.showLoader = false;
      })
    }

    populateAllData(resp) {
      if(resp.Product.length) {
        let allValues = resp.Product[0];
        this.createProduct.ProductCode = allValues.ProductCode;
        this.createProduct.ProductDesc = allValues.ProductDesc;
        this.createProduct.Mrp = allValues.MRP;
        this.createProduct.CostPrice = allValues.CostPrice;
        this.createProduct.SalePrice = allValues.SellingPrice;
        this.createProduct.SourceID = allValues.SourceID ? allValues.SourceID : 1;
        this.createProduct.ProductTypeID = allValues.ProductTypeID ? allValues.ProductTypeID : 1;
        this.createProduct.BarCode = allValues.BarCode;
        this.createProduct.ColorID = allValues.ColorID ? allValues.ColorID : 1;
        this.createProduct.GenderID = allValues.GenderID ? allValues.GenderID : 1;
        this.createProduct.ProductCatogeryID = allValues.ProductCatogeryID ? allValues.ProductCatogeryID : 1;
        this.createProduct.FitID = allValues.FitID ? allValues.FitID : 1;
        this.createProduct.VarientID = allValues.VarientID ? allValues.VarientID : 1;
        this.createProduct.Lot = allValues.Lot;
        this.createProduct.Remark = allValues.Remark;
        this.createProduct.IsActive = allValues.Active;
      }
    }

    validateData() {
      return true;
      // if(this.createProduct.LotID && this.createProduct.LotID > 0 && this.createProduct.WashingQty > 0 && 
      //   this.createProduct.Washer > 0 && this.createProduct.WashingType > 0) {
      //   if(this.createProduct.ReceiveQty) {
      //     if(this.createProduct.ReceiveDate) {
      //       return true;
      //     }
      //     this.errMessage = 'Please select receive date';
      //     return false;
      //   }
      //   if(this.createProduct.ReceiveDate) {
      //     if(this.createProduct.ReceiveQty) {
      //       return true;
      //     }
      //     this.errMessage = 'Please select receive quantity';
      //     return false;
      //   }
      //   return true;
      // }
      // this.errMessage = 'Please fill all the mandatory information !!!';
      // return false;
    }

    goToListPage() {
      if (this.cacheService.has("allProductList")) {
        this.cacheService.set("redirectToProductList", 'back');
      }
      this.router.navigate(['/pages/product/list']);
    }
    submitProduct() {
      if(!this.validateData()) {
        this.notification.error('Error', this.errMessage)
        return;
      }
      let postData = {
        "ProductID": +this.ProductID,
        "ProductCode": this.createProduct.ProductCode,
        "ProductDesc": this.createProduct.ProductDesc,
        "MRP": this.createProduct.Mrp,
        "CostPrice": this.createProduct.CostPrice,
        "ProductTypeID": this.createProduct.ProductTypeID,
        "BarCode": this.createProduct.BarCode,
        "SellingPrice": this.createProduct.SalePrice,
        "GenderID": this.createProduct.GenderID,
        "FitID": this.createProduct.FitID,
        "ColorID": this.createProduct.ColorID,
        "ProductCatogeryID": this.createProduct.ProductCatogeryID,
        "Remark": this.createProduct.Remark,
        "Active": this.createProduct.IsActive,
        "CreatedBy": this.userID,
      }
      this.showLoader = true;
      this.productService.createProduct(postData).subscribe(res => {
        this.showLoader = false;
        const response = JSON.parse(JSON.stringify(res));
        if(response.Error && response.Error[0].ERROR == 0) {
          if (this.cacheService.has("allProductList")) {
            this.cacheService.set("redirectAfterProductSave", 'saved');
            if (this.cacheService.has("listProductFilterData")) {
              this.cacheService.get("listProductFilterData").subscribe((res) => {
                let resp = JSON.parse(JSON.stringify(res));
                resp.ProductTypeID = 1;
                resp.FitID = 1;
                resp.ColorID = 1;
                resp.ProductCategoryID = 1;
                resp.GenderID = 1;
                resp.SourceID = 1;
                this.cacheService.set("listProductFilterData", resp);
              });
            }
          }
          this.notification.success('Success', response.Error[0].Msg);
          this.router.navigate(['/pages/product/list']);
        } else {
          this.notification.error('Error', response.Error[0].Msg);
        }
      }, err => {
        this.showLoader = false;
        this.notification.error('Error', 'Something went wrong!');
      })
    }

}