import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../../shared/user.service';
import { GenericSort } from '../../../shared/pipes/generic-sort.pipe';
import { CacheService } from '../../../shared/cache.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import * as _ from 'lodash';
import { PurchaseOrderService } from '../purchase-order.service';

@Component({
  selector: 'app-create-purchase-order',
  templateUrl: './create-purchase-order.component.html',
  styleUrls: ['./create-purchase-order.component.scss']
})
export class CreatePurchaseOrderComponent implements OnInit {
  todaysDate;
  showLoader = false;
  cardTitle = 'CREATE NEW Purchase Order';
  isViewOnly = false;
  isEditOnly = false;
  createPurchaseOrder;
  allItemType = [];
  allSupplier = [];
  allItems = [];
  filteredItems = [];
  selectedProduct = [];
  userID = '';
  PurchaseID = 0;
  customerDetail = '';
  disableStatus = false;
  filterStateData = false;
  IsfollowUpDate = false;
  showCreateOrder = false;
  itemCode = '';
  constructor(protected userService: UserService, private purchaseService: PurchaseOrderService,
    private router: Router, private activatedRoute: ActivatedRoute,
    protected cacheService: CacheService, protected modalService: NgbModal,
    private notification: NotificationsService, private genericSort: GenericSort) { }

    ngOnInit() {
      const now = new Date();
      this.userID = localStorage.getItem('UserLoginId');
      this.todaysDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
      this.createPurchaseOrder = this.purchaseService.getPurchaseObject();
      this.createPurchaseOrder = JSON.parse(JSON.stringify(this.createPurchaseOrder));
      this.disableStatus = true;
      this.createPurchaseOrder.PurchaseDate = this.todaysDate;
      this.createPurchaseOrder.PurchaseNumber = '';
      this.createPurchaseOrder.Supplier = 0;
      this.createPurchaseOrder.ItemType = 0;
      this.createPurchaseOrder.RefInvoiceNumber = '';
      this.createPurchaseOrder.InvoiceReceived = false;
      this.getMasterData();
      const activatedRouteObject = this.activatedRoute.snapshot.data;
      if(activatedRouteObject['viewMode'] === true) {
        this.isViewOnly = true;
        this.cardTitle = 'VIEW Purchase Order'
        const purchaseId = this.activatedRoute.snapshot.params.purchaseId;
        this.PurchaseID = purchaseId;
        this.getDetails(purchaseId);
      } else if(activatedRouteObject['editMode'] === true) {
        this.disableStatus = false;
        this.isEditOnly = true;
        this.cardTitle = 'EDIT PUrchase Order'
        const purchaseId = this.activatedRoute.snapshot.params.purchaseId;
        this.PurchaseID = purchaseId;
        this.getDetails(purchaseId);
      }
      this.selectedProduct.push({});
    }
    getMasterData() {
      this.showLoader = true;
      this.purchaseService.getMasterData(this.userID).subscribe(res => {
        this.showLoader = false;
        let lookUpData = JSON.parse(JSON.stringify(res));
        this.allItemType = lookUpData.ItemType;
        this.allSupplier = lookUpData.Vendor;
        this.allItems = JSON.parse(JSON.stringify(lookUpData.Item));
      },(error)=> {
        this.showLoader = false;
        this.notification.error('Error','Error While Lookup Master Data');
      })
    }
    getDetails(id) {
      this.showLoader = true;
      this.purchaseService.getPurchaseOrderDetails(id,this.userID).subscribe(res => {
        this.showLoader = false;
        const resp = JSON.parse(JSON.stringify(res));
        this.populateAllData(resp);
      },(err) => {
        this.showLoader = false;
      })
    }

    populateAllData(resp) {
      if(resp.PurchaseOrder.length) {
        let allValues = resp.PurchaseOrder[0];
        const PurchaseDateArray = allValues.PurchaseDate.split('/');
        this.createPurchaseOrder.PurchaseDate = { year: +PurchaseDateArray[2], month: +PurchaseDateArray[0], day: +PurchaseDateArray[1] };
        this.createPurchaseOrder.PurchaseNumber = allValues.PONumber;
        this.createPurchaseOrder.ItemType = allValues.ItemTypeID;
        this.createPurchaseOrder.Supplier = allValues.SupplierID;
        this.createPurchaseOrder.RefInvoiceNumber = allValues.RefInvoiceNumber;
        this.createPurchaseOrder.InvoiceReceived = allValues.IsInvoiceReceived;
        this.itemCode = allValues.ItemTypeCode;
        this.filterItems();
        if(resp.PurchaseOrderDetail.length) {
          let orderDetails = resp.PurchaseOrderDetail;
          this.selectedProduct = orderDetails;
        }
      }
    }

    onItemTypeChange() {
      this.selectedProduct = [];
      if(this.createPurchaseOrder.ItemType > 0) {
        for(let i=0; i< this.allItemType.length; i++) {
          if(this.allItemType[i].ItemTypeID == this.createPurchaseOrder.ItemType) {
            this.itemCode = this.allItemType[i].Code;
            break;
          }
        }
        this.selectedProduct.push({ItemID: 0,SortNO: '',Quantity: 0,LengthMeter: '',WidthMeter: '',Rate: 0});
        this.filterItems();
      } else {
        this.selectedProduct = [];
        this.filteredItems = [];
        this.itemCode = '';
      }
    }
    addItemRow() {
      this.selectedProduct.push({ItemID: 0,SortNO: '',Quantity: 0,LengthMeter: '',WidthMeter: '',Rate: 0});
    }
    onItemChange(item) {
      // let len = 0;
      // for(let i=0; i< this.selectedProduct.length; i++) {
      //   if(this.selectedProduct[i].ItemID == item.ItemID) {
      //     len++;
      //     if(len == 2) {
      //       this.selectedProduct[index].ItemID = 0;
      //       //item.ItemID = 0;
      //       this.notification.error('Can not select same product again !!!');
      //       return;
      //     }
      //   }
      // }
      item.SortNO = '';
      item.Quantity = 0;
      item.Rate = 0;
      item.LengthMeter = '';
      item.WidthMeter = '';
    }
    filterItems() {
      const allItems = JSON.parse(JSON.stringify(this.allItems));
      this.filteredItems = allItems.filter(x => x.ItemTypeID == this.createPurchaseOrder.ItemType);
    }
    validateData() {
      if(this.createPurchaseOrder.ItemType > 0 && this.createPurchaseOrder.Supplier > 0 && this.validateItems()) {
          return true;
        }
      return false;
    }
    validateItems() {
      if(this.selectedProduct.length == 0){
        return false;
      }
      for(let i=0; i< this.selectedProduct.length; i++) {
        if((!this.selectedProduct[i].ItemID || this.selectedProduct[i].ItemID == 0) || (!this.selectedProduct[i].Quantity) || (this.selectedProduct[i].Quantity == 0) || (!this.selectedProduct[i].Rate || this.selectedProduct[i].Rate == 0) ) {
          return false;
        }
      }
      return true
    }
    goToListPage() {
      if (this.cacheService.has("allPurchaseList")) {
        this.cacheService.set("redirectToPurchaseList", 'back');
      }
      this.router.navigate(['/pages/purchase-order/list']);
    }
    submitPurchaseOrder() {
      if(!this.validateData()) {
        this.notification.error('Error', 'Please fill all the mandatory information !!!')
        return;
      }
      let postData = {
        "PurchaseID": +this.PurchaseID,
        "PurchaseDate": `${this.createPurchaseOrder.PurchaseDate.month}/${this.createPurchaseOrder.PurchaseDate.day}/${this.createPurchaseOrder.PurchaseDate.year}`,
        "SupplierID": this.createPurchaseOrder.Supplier,
        "ItemTypeID": this.createPurchaseOrder.ItemType,
        "RefInvoiceNumber": this.createPurchaseOrder.RefInvoiceNumber,
        "CreatedBy": this.userID,
        "IsInvoiceReceived": this.createPurchaseOrder.InvoiceReceived,
        "PODetail": this.selectedProduct
      }
      this.showLoader = true;
      this.purchaseService.createPurchaseOrder(postData).subscribe(res => {
        this.showLoader = false;
        const response = JSON.parse(JSON.stringify(res));
        if(response.Error && response.Error[0].ERROR == 0) {
          if (this.cacheService.has("allLeadList")) {
            this.cacheService.set("redirectAfterOrderSave", 'saved');
            if (this.cacheService.has("listPurchaseFilterData")) {
              this.cacheService.get("listPurchaseFilterData").subscribe((res) => {
                let resp = JSON.parse(JSON.stringify(res));
                resp.Supplier = 1;
                resp.ItemType = 1;
                resp.startDate = this.createPurchaseOrder.PurchaseDate;
                resp.endDate = this.createPurchaseOrder.PurchaseDate;
                this.cacheService.set("listPurchaseFilterData", resp);
              });
            }
          }
          const id = response.Error[0].PurchaseID;
          this.notification.success('Success', response.Error[0].Msg);
          this.router.navigate(['/pages/purchase-order/list']);
        } else {
          this.notification.error('Error', response.Error[0].Msg);
        }
      }, err => {
        this.showLoader = false;
        this.notification.error('Error', 'Something went wrong!');
      })
    }
    onDelete(index) {
      this.selectedProduct.splice(index,1);
    }
    removeZero(item, key) {
      if(item.Quantity == 0 && key == 'quantity') {
        item.Quantity = '';
      } else if(item.Rate == 0 && key == 'price') {
        item.Rate = '';
      } else if(this.createPurchaseOrder.RefInvoiceNumber == 0 && key == 'ref') {
        this.createPurchaseOrder.RefInvoiceNumber = '';
      }
    }
    addZero(item, key) {
      if(item.Quantity == '' && key == 'quantity') {
        item.Quantity = 0;
      }else if(item.Rate == '' && key == 'price') {
        item.Rate = 0;
      } else if(this.createPurchaseOrder.RefInvoiceNumber == '' && key == 'ref') {
        this.createPurchaseOrder.RefInvoiceNumber = 0;
      }
    }
}