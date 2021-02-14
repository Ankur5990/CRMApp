import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../../shared/user.service';
import { GenericSort } from '../../../shared/pipes/generic-sort.pipe';
import { CacheService } from '../../../shared/cache.service';
import * as _ from 'lodash';
import { CuttingService } from '../cutting.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-create-cutting',
  templateUrl: './create-cutting.component.html',
  styleUrls: ['./create-cutting.component.scss']
})
export class CreateCuttingComponent implements OnInit {
  todaysDate;
  showLoader = false;
  cardTitle = 'Create New Cutting';
  isViewOnly = false;
  isEditOnly = false;
  createCutting;
  fabricList = [];
  allFitType = [];
  userID = '';
  CuttingID = 0;
  showList = false;
  fabricKey = '';
  sortValue = '';
  detail = false;
  displayDate = '';
  searchFabric$ = new Subject<string>();
  constructor(protected userService: UserService, private cuttingService: CuttingService,
    private router: Router, private activatedRoute: ActivatedRoute,
    protected cacheService: CacheService, protected modalService: NgbModal,
    private notification: NotificationsService, private genericSort: GenericSort) { }

    ngOnInit() {
      const now = new Date();
      this.userID = localStorage.getItem('UserLoginId');
      this.todaysDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
      this.createCutting = this.cuttingService.getCuttingObject();
      this.createCutting = JSON.parse(JSON.stringify(this.createCutting));
      this.createCutting.CuttingDate = this.todaysDate;
      this.createCutting.LotNo = '';
      this.createCutting.Length = '';
      this.createCutting.Width = '';
      this.createCutting.CuttingPcs = '';
      this.createCutting.SamplePcs = '';
      this.createCutting.NoOfRoll = '';
      this.createCutting.DamagePcs = '';
      this.createCutting.Average = '';
      this.createCutting.Remark = '';
      this.createCutting.Status = 'Cutting';
      this.createCutting.FabricId = 0;
      this.createCutting.FitType = 0;
      this.getMasterData();
      const activatedRouteObject = this.activatedRoute.snapshot.data;
      if(activatedRouteObject['viewMode'] === true) {
        this.isViewOnly = true;
        this.cardTitle = 'View Cutting'
        const cuttingId = this.activatedRoute.snapshot.params.cuttingId;
        this.CuttingID = cuttingId;
        this.getDetails(cuttingId);
      } else if(activatedRouteObject['editMode'] === true) {
        this.isEditOnly = true;
        this.cardTitle = 'Edit Cutting'
        const cuttingId = this.activatedRoute.snapshot.params.cuttingId;
        this.CuttingID = cuttingId;
        this.getDetails(cuttingId);
      }
      this.cuttingService.searchList(this.searchFabric$,this.userID)
      .subscribe(results => {
        this.showList = true;
        if(results['CuttingSortNumberList']) {
          this.fabricList = results['CuttingSortNumberList']
        }
      });
    }
    getMasterData() {
      this.showLoader = true;
      this.cuttingService.getProductionMaster().subscribe(res => {
        this.showLoader = false;
        let lookUpData = JSON.parse(JSON.stringify(res));
        this.allFitType = lookUpData.FIT;
      },(error)=> {
        this.showLoader = false;
        this.notification.error('Error','Error While Lookup Master Data');
      })
    }
    getDetails(id) {
      this.detail = true;
      this.showLoader = true;
      this.cuttingService.getCuttingDetails(id,this.userID).subscribe(res => {
        this.showLoader = false;
        const resp = JSON.parse(JSON.stringify(res));
        this.populateAllData(resp);
      },(err) => {
        this.showLoader = false;
      })
    }

    populateAllData(resp) {
      if(resp.Cutting.length) {
        let allValues = resp.Cutting[0];
        const CuttingDateArray = allValues.CuttingDate.split('/');
        this.createCutting.CuttingDate = { year: +CuttingDateArray[2], month: +CuttingDateArray[0], day: +CuttingDateArray[1] };
        this.displayDate = allValues.CuttingDate;
        this.createCutting.LotNo = allValues.LotID;
        this.createCutting.CuttingPcs = allValues.QtyIssue;
        this.createCutting.FitType = allValues.FitID;
        this.createCutting.SamplePcs = allValues.SampleQty;
        this.createCutting.NoOfRoll = allValues.NoOfRoll;
        this.createCutting.DamagePcs = allValues.QtyDamage;
        this.createCutting.Average = allValues.Average;
        this.createCutting.Remark = allValues.Remark;
        this.createCutting.Status = allValues.Status;
        this.createCutting.FabricId = allValues.PurchaseDetailID;
        this.sortValue = allValues.SortNO;
        this.createCutting.Length = allValues.LengthMeter;
        this.createCutting.Width = allValues.WidthMeter;
      }
    }

    validateData() {
      if(this.createCutting.FabricId && this.createCutting.FabricId > 0 && this.createCutting.CuttingPcs > 0 && this.createCutting.FitType >0) {
        return true;
      }
      return false;
    }

    goToListPage() {
      if (this.cacheService.has("allCuttingList")) {
        this.cacheService.set("redirectToCuttingList", 'back');
      }
      this.router.navigate(['/pages/cutting/list']);
    }
    submitCutting() {
      if(!this.validateData()) {
        this.notification.error('Error', 'Please fill all the mandatory information !!!')
        return;
      }
      let postData = {
        "CuttingID": +this.CuttingID,
        "CuttingDate": `${this.createCutting.CuttingDate.month}/${this.createCutting.CuttingDate.day}/${this.createCutting.CuttingDate.year}`,
        "PurchaseDetailID": this.createCutting.FabricId,
        "FitID": this.createCutting.FitType,
        "LengthMeter": this.createCutting.Length,
        "QtyIssue": this.createCutting.CuttingPcs,
        "SampleQty": this.createCutting.SamplePcs,
        "NoOfRoll": this.createCutting.NoOfRoll,
        "QtyDamage": this.createCutting.DamagePcs,
        "Remark": this.createCutting.Remark,
        "UserID": this.userID,
      }
      this.showLoader = true;
      this.cuttingService.createCutting(postData).subscribe(res => {
        this.showLoader = false;
        const response = JSON.parse(JSON.stringify(res));
        if(response.Error && response.Error[0].ERROR == 0) {
          if (this.cacheService.has("allCuttingList")) {
            this.cacheService.set("redirectAfterCuttingSave", 'saved');
            if (this.cacheService.has("listCuttingFilterData")) {
              this.cacheService.get("listCuttingFilterData").subscribe((res) => {
                let resp = JSON.parse(JSON.stringify(res));
                resp.startDate = this.createCutting.CuttingDate;
                resp.endDate = this.createCutting.CuttingDate;
                resp.FitType = 1;
                this.cacheService.set("listCuttingFilterData", resp);
              });
            }
          }
          const id = response.Error[0].CuttingID;
          this.notification.success('Success', response.Error[0].Msg);
          this.router.navigate(['/pages/cutting/list']);
        } else {
          this.notification.error('Error', response.Error[0].Msg);
        }
      }, err => {
        this.showLoader = false;
        this.notification.error('Error', 'Something went wrong!');
      })
    }

    // removeZero(key) {
    //   if(this.createCutting.CuttingPcs == 0 && key == 'cuttingpcs') {
    //     this.createCutting.CuttingPcs = '';
    //   }else if(this.createCutting.NoOfRoll == 0 && key == 'NoOfRoll') {
    //     this.createCutting.NoOfRoll = '';
    //   }else if(this.createCutting.DamagePcs == 0 && key == 'damagepcs') {
    //     this.createCutting.DamagePcs = '';
    //   }else if(this.createCutting.Average == 0 &&key == 'average') {
    //     this.createCutting.Average = '';
    //   }
    // }

    // addZero(key) {
    //   if(this.createCutting.CuttingPcs == '' && key == 'cuttingpcs') {
    //     this.createCutting.CuttingPcs = 0;
    //   }else if(this.createCutting.NoOfRoll == '' && key == 'NoOfRoll') {
    //     this.createCutting.NoOfRoll = 0;
    //   }else if(this.createCutting.DamagePcs == '' && key == 'damagepcs') {
    //     this.createCutting.DamagePcs = 0;
    //   }else if(this.createCutting.Average == '' &&key == 'average') {
    //     this.createCutting.Average = 0;
    //   }
    // }
    fabricSelected(item) {
      this.showList = false;
      this.fabricList = [];
      this.fabricKey = `${item.SortNO}`;
      this.createCutting.FabricId = item.PurchaseDetailID;
      this.createCutting.Length = item.LengthMeter;
      this.createCutting.Width = item.WidthMeter;
      this.createCutting.NoOfRoll = item.BalanceRoll;
    }
    calculateAverage() {
      this.createCutting.Average = '';
      if(this.createCutting.Length > 0 && this.createCutting.CuttingPcs > 0) {
        let totaldivent = (+this.createCutting.CuttingPcs);
        if(this.createCutting.SamplePcs) {
          totaldivent = totaldivent + (+this.createCutting.SamplePcs);
        }
        this.createCutting.Average = (this.createCutting.Length/ totaldivent).toFixed(2);
      }
    }
}