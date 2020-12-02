import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../../shared/user.service';
import { GenericSort } from '../../../shared/pipes/generic-sort.pipe';
import { CacheService } from '../../../shared/cache.service';
import * as _ from 'lodash';
import { CostingService } from '../costing.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-create-costing',
  templateUrl: './create-costing.component.html',
  styleUrls: ['./create-costing.component.scss']
})
export class CreateCostingComponent implements OnInit {
  todaysDate;
  showLoader = false;
  cardTitle = 'CREATE NEW Costing';
  isViewOnly = false;
  isEditOnly = false;
  createCosting;
  allColor = [];
  allFitType = [];
  allProductType = [];
  filteredItems = [];
  selectedItems = [];
  allCostRange = [];
  userID = '';
  CostingID = 0;
  customerDetail = '';
  disableStatus = false;
  filterStateData = false;
  IsfollowUpDate = false;
  showCreateOrder = false;
  itemCode = '';
  detail = false;
  showList = false;
  lotNoValue = '';
  LotNoKey = '';
  allLotsList = [];
  searchLotNo$ = new Subject<string>();
  WashingRate = 0;
  GSTPercentage = 0;
  marginRate = 0;
  RoleID = 0;
  constructor(protected userService: UserService, private costingService: CostingService,
    private router: Router, private activatedRoute: ActivatedRoute,
    protected cacheService: CacheService, protected modalService: NgbModal,
    private notification: NotificationsService, private genericSort: GenericSort) { }

    ngOnInit() {
      const now = new Date();
      this.userID = localStorage.getItem('UserLoginId');
      this.createCosting = this.costingService.getCostingObject();
      this.createCosting = JSON.parse(JSON.stringify(this.createCosting));
      this.todaysDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
      this.disableStatus = true;
      this.createCosting.CostingDate = this.todaysDate;
      this.createCosting.LotID = '';
      this.createCosting.ProductType = 0;
      this.createCosting.FitType = 0;
      this.createCosting.FabricPrice = '';
      this.createCosting.Average = '';
      this.createCosting.FabricCost = '';
      this.createCosting.TailorCost = '';
      this.createCosting.ExtraTailor = '';
      this.createCosting.ZIPCost = '';
      this.createCosting.ThreadCost = '';
      this.createCosting.LiningCost = '';
      this.createCosting.TrimsCost = '';
      this.createCosting.FinishingCost = '';
      this.createCosting.OverheadsCost = '';
      this.createCosting.ExtraCost = 0;
      this.getMasterData();
      const activatedRouteObject = this.activatedRoute.snapshot.data;
      if(activatedRouteObject['viewMode'] === true) {
        this.detail = true;
        this.isViewOnly = true;
        this.cardTitle = 'VIEW Costing'
        const costingId = this.activatedRoute.snapshot.params.costingId;
        this.CostingID = costingId;
        this.getDetails(costingId);
      } else if(activatedRouteObject['editMode'] === true) {
        this.detail = true;
        this.disableStatus = false;
        this.isEditOnly = true;
        this.cardTitle = 'EDIT Costing'
        const costingId = this.activatedRoute.snapshot.params.costingId;
        this.CostingID = costingId;
        this.getDetails(costingId);
      }
      this.costingService.searchList(this.searchLotNo$,this.userID)
      .subscribe(results => {
        this.showList = true;
        if(results['CostingLotList']) {
          this.allLotsList = results['CostingLotList']
        }
      });
      this.selectedItems.push({ColorID: 0,IsDistressed: false,ProductCode: '',ProductDesc:'',
                                WashingCost: '',Finalcost: '',MarginCost: '',TotalCost: '',GST: '',SellingPrice: '',MRP: ''});
    }
    getMasterData() {
      this.showLoader = true;
      this.costingService.getMasterData().subscribe(res => {
        this.showLoader = false;
        let lookUpData = JSON.parse(JSON.stringify(res));
        this.allColor = lookUpData.Color;
        this.allFitType = lookUpData.FIT;
        this.allProductType = lookUpData.ProductType;
        this.allCostRange = lookUpData.ProductCostSlab;
      },(error)=> {
        this.showLoader = false;
        this.notification.error('Error','Error While Lookup Master Data');
      })
    }
    getDetails(id) {
      this.showLoader = true;
      this.costingService.getCostingDetails(id,this.userID).subscribe(res => {
        this.showLoader = false;
        const resp = JSON.parse(JSON.stringify(res));
        this.populateAllData(resp);
      },(err) => {
        this.showLoader = false;
      })
    }

    populateAllData(resp) {
      if(resp.Costing.length) {
        let allValues = resp.Costing[0];
        const CostingDateArray = allValues.CostingDate.split('/');
        this.createCosting.CostingDate = { year: +CostingDateArray[2], month: +CostingDateArray[0], day: +CostingDateArray[1] };
        this.createCosting.LotID = allValues.LotID;
        this.lotNoValue = allValues.SortNO;
        this.createCosting.ProductType = allValues.ProductTypeID;
        this.createCosting.FitType = allValues.FitID;
        this.createCosting.FabricPrice = allValues.FabricPrice;
        this.createCosting.Average = allValues.Average;
        this.createCosting.FabricCost = allValues.FabricCost;
        this.createCosting.TailorCost = allValues.TailorCost;
        this.createCosting.ExtraTailor = allValues.ExtraTailorCost;
        this.createCosting.ZIPCost = allValues.ZIPCost;
        this.createCosting.ThreadCost = allValues.ThreadCost;
        this.createCosting.LiningCost = allValues.LiningCost;
        this.createCosting.TrimsCost = allValues.TrimsCost;
        this.createCosting.FinishingCost = allValues.FinishingCost;
        this.createCosting.OverheadsCost = allValues.OverheadsCost;
        this.createCosting.ExtraCost = allValues.ExtraCost;
        this.GSTPercentage = allValues.GSTPercentage;
        this.marginRate = allValues.MarginPercentage;
        this.WashingRate = allValues.WashingRate;
        this.RoleID = allValues.RoleID;
        if(resp.CostingDetail.length) {
          let costingDetails = resp.CostingDetail;
          this.selectedItems = costingDetails;
        }
      }
    }
    addItemRow() {
      this.selectedItems.push({ColorID: 0,IsDistressed: false,ProductCode: '',ProductDesc:'',
      WashingCost: '',Finalcost: '',MarginCost: '',TotalCost: '',GST: '',SellingPrice: '',MRP: ''});
    }
    onProductTypeChange() {
      for(let i=0; i<this.allProductType.length; i++) {
        if(this.createCosting.ProductType == this.allProductType[i].ProductTypeID) {
          this.marginRate = this.allProductType[i].MarginPercentage;
          break;
        }
      }
      this.removeAllAndAddOneRow();
    }
    onItemChange(item, index) {
      this.selectedItems[index].WashingCost = this.WashingRate;
      this.calculateTotal(item,index);
    }
    onWashingChange(item, index) {
      this.calculateTotal(item,index);
    }
    validateData() {
      if(this.createCosting.LotID <= 0) {
        this.notification.error('Error', 'Please Select Lot No');
        return false
      } else if(this.createCosting.ProductType == 0) {
        this.notification.error('Error', 'Please Select Product Type');
        return false;
      } else if(this.createCosting.FitType == 0) {
        this.notification.error('Error', 'Please Select Fit Type');
        return false;
      } else if(!this.validateItems()) {
        this.notification.error('Error', 'Please Select Color in Grid');
        return false;
      }
      return true;
    }
    validateItems() {
      if(this.selectedItems.length == 0) {
        return false;
      }
      for(let i=0; i< this.selectedItems.length; i++) {
        if(((!this.selectedItems[i].ColorID) || (this.selectedItems[i].ColorID == 0))) {
          return false;
        }
      }
      return true
    }
    goToListPage() {
      if (this.cacheService.has("allCostingList")) {
        this.cacheService.set("redirectToCostingList", 'back');
      }
      this.router.navigate(['/pages/costing/list']);
    }
    submitCosting() {
      if(!this.validateData()) {
        return;
      }
      let postData = {
        "CostingID": +this.CostingID,
        "CostingDate": `${this.createCosting.CostingDate.month}/${this.createCosting.CostingDate.day}/${this.createCosting.CostingDate.year}`,
        "CreatedBy": this.userID,
        "LotID": this.createCosting.LotID,
        "ProductTypeID": this.createCosting.ProductType,
        "FitID": this.createCosting.FitType,
        "FabricCost":this.createCosting.FabricCost,
        "TailorCost": this.createCosting.TailorCost,
        "ExtraTailorCost": this.createCosting.ExtraTailor,
        "ZIPCost": this.createCosting.ZIPCost,
        "ThreadCost": this.createCosting.ThreadCost,
        "LiningCost": this.createCosting.LiningCost,
        "TrimsCost": this.createCosting.TrimsCost,
        "FinishingCost": this.createCosting.FinishingCost,
        "OverheadsCost": this.createCosting.OverheadsCost,
        "ExtraCost": this.createCosting.ExtraCost,
        "CostingDetail": this.selectedItems
      }
      this.showLoader = true;
      this.costingService.createCosting(postData).subscribe(res => {
        this.showLoader = false;
        const response = JSON.parse(JSON.stringify(res));
        if(response.Error && response.Error[0].ERROR == 0) {
          if (this.cacheService.has("allCostingList")) {
            this.cacheService.set("redirectAfterCostingSave", 'saved');
            if (this.cacheService.has("listCostingFilterData")) {
              this.cacheService.get("listCostingFilterData").subscribe((res) => {
                let resp = JSON.parse(JSON.stringify(res));
                resp.startDate = this.createCosting.CostingDate;
                resp.endDate = this.createCosting.CostingDate;
                resp.ProductType = 1;
                resp.FitType = 1;
                this.cacheService.set("listCostingFilterData", resp);
              });
            }
          }
          const id = response.Error[0].CostingID;
          this.notification.success('Success', response.Error[0].Msg);
          this.router.navigate(['/pages/costing/list']);
        } else {
          this.notification.error('Error', response.Error[0].Msg);
        }
      }, err => {
        this.showLoader = false;
        this.notification.error('Error', 'Something went wrong!');
      })
    }
    onDelete(index) {
      this.selectedItems.splice(index,1);
    }

    refreshCalucaltionChange() {
      if(this.createCosting.LotID > 0 && this.createCosting.ProductType > 0 && this.selectedItems[0].ColorID > 0) {
        for(let i=0; i<this.selectedItems.length; i++) {
          this.calculateTotal(this.selectedItems[i], i);
        }
      }
    }
    lotNoSelected(item) {
      this.LotNoKey = item.SortNO;
      this.createCosting.LotID = item.LotID;
      this.createCosting.FabricPrice = item.FabricPrice;
      this.createCosting.Average = item.Average;
      this.createCosting.FabricCost = item.FabricCost;
      this.createCosting.TailorCost = item.TailorRate;
      this.createCosting.ExtraTailor = item.ExtraTailorRate;
      this.createCosting.ZIPCost = item.ZIPRate;
      this.createCosting.ThreadCost = item.ThreadRate;
      this.createCosting.LiningCost = item.LiningRate;
      this.createCosting.TrimsCost = item.TrimsRate;
      this.createCosting.FinishingCost = item.FinishingRate;
      this.createCosting.OverheadsCost = item.OverheadsRate;
      this.RoleID = item.RoleID;
      this.GSTPercentage = item.GSTPercentage;
      this.WashingRate = item.WashingRate;
      this.showList = false;
      this.allLotsList = [];
      this.removeAllAndAddOneRow();
    }
    removeAllAndAddOneRow() {
      this.selectedItems = [];
      this.selectedItems.push({ColorID: 0,IsDistressed: false,ProductCode: '',ProductDesc:'',
      WashingCost: '',Finalcost: '',MarginCost: '',TotalCost: '',GST: '',SellingPrice: '',MRP: ''});
    }
    calculateTotal(item,index) {
      let totalRate = 0;
      totalRate = this.createCosting.FabricCost + this.createCosting.TailorCost 
      + this.createCosting.ZIPCost + this.createCosting.FinishingCost
      + this.createCosting.OverheadsCost;
      if(this.createCosting.ExtraTailor) {
        totalRate = totalRate + (+this.createCosting.ExtraTailor);
      }
      if(this.createCosting.ThreadCost) {
        totalRate = totalRate + (+this.createCosting.ThreadCost);
      }
      if(this.createCosting.LiningCost) {
        totalRate = totalRate + (+this.createCosting.LiningCost);
      }
      if(this.createCosting.TrimsCost) {
        totalRate = totalRate + (+this.createCosting.TrimsCost)
      }
      if(this.createCosting.ExtraCost) {
        totalRate = totalRate + (+this.createCosting.ExtraCost)
      }
      if(item.WashingCost) {
        totalRate = totalRate + (+item.WashingCost);
      }
      const margin = ((totalRate/100)*this.marginRate).toFixed(2);
      const totalCost = totalRate + (+margin);
      const gst = ((totalRate/100)*this.GSTPercentage).toFixed(2);
      const sp = totalCost + (+gst);
      const finalMRP = this.calculateRange(sp);
      this.selectedItems[index].Finalcost = totalRate;
      this.selectedItems[index].MarginCost = margin;
      this.selectedItems[index].TotalCost = totalCost;
      this.selectedItems[index].GST = gst;
      this.selectedItems[index].SellingPrice = sp;
      this.selectedItems[index].MRP = finalMRP;
    }
  
    calculateRange(val) {
      const noRangeValue = 0;
      for(let i=0; i< this.allCostRange.length ; i++) {
        if( val >= this.allCostRange[i].SPFROM && val <= this.allCostRange[i].SPTO) {
          return this.allCostRange[i].MRP;
        }
      }
      return noRangeValue;
    }
    addZero() {
      if(this.createCosting.ExtraCost == '') {
        this.createCosting.ExtraCost = 0;
      }
    }
    removeZero() {
      if(this.createCosting.ExtraCost == 0) {
        this.createCosting.ExtraCost = '';
      }
    }
}