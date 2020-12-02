import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../../shared/user.service';
import { GenericSort } from '../../../shared/pipes/generic-sort.pipe';
import { CacheService } from '../../../shared/cache.service';
import * as _ from 'lodash';
import { WashingService } from '../washing.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-create-washing',
  templateUrl: './create-washing.component.html',
  styleUrls: ['./create-washing.component.scss']
})
export class CreateWashingComponent implements OnInit {
  todaysDate;
  showLoader = false;
  cardTitle = 'CREATE NEW Washing';
  isViewOnly = false;
  isEditOnly = false;
  createWashing;
  lotNoLists = [];
  allWasher = [];
  allWashingType = [];
  userID = '';
  WashingID = 0;
  showList = false;
  lotNoKey = '';
  lotNoValue = '';
  detail = false;
  displayDate = '';
  errMessage = 'Please fill all the mandatory information !!!';
  searchLotNo$ = new Subject<string>();
  constructor(protected userService: UserService, private washingService: WashingService,
    private router: Router, private activatedRoute: ActivatedRoute,
    protected cacheService: CacheService, protected modalService: NgbModal,
    private notification: NotificationsService, private genericSort: GenericSort) { }

    ngOnInit() {
      const now = new Date();
      this.userID = localStorage.getItem('UserLoginId');
      this.todaysDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
      this.createWashing = this.washingService.getWashingObject();
      this.createWashing = JSON.parse(JSON.stringify(this.createWashing));
      this.createWashing.WashingDate = this.todaysDate;
      this.createWashing.ReceiveDate = '';
      this.createWashing.WashingDay = '';
      this.createWashing.Washer = 0;
      this.createWashing.WashingType = 0;
      this.createWashing.WashingQty = '';
      this.createWashing.ReceiveQty = '';
      this.createWashing.DamageQty = '';
      this.createWashing.Remark = '';
      this.createWashing.LotID = 0;
      this.createWashing.BalanceQty = 0;
      this.createWashing.Status = 'Washing Issue';
      this.getMasterData();
      const activatedRouteObject = this.activatedRoute.snapshot.data;
      if(activatedRouteObject['viewMode'] === true) {
        this.isViewOnly = true;
        this.cardTitle = 'VIEW Washing'
        const washingId = this.activatedRoute.snapshot.params.washingId;
        this.WashingID = washingId;
        this.getDetails(washingId);
      } else if(activatedRouteObject['editMode'] === true) {
        this.isEditOnly = true;
        this.cardTitle = 'EDIT Wahing'
        const washingId = this.activatedRoute.snapshot.params.washingId;
        this.WashingID = washingId;
        this.getDetails(washingId);
      }
      this.washingService.searchList(this.searchLotNo$,this.userID)
      .subscribe(results => {
        this.showList = true;
        if(results['WashingLotList']) {
          this.lotNoLists = results['WashingLotList']
        }
      });
    }
    getMasterData() {
      this.showLoader = true;
      this.washingService.getMasterData().subscribe(res => {
        this.showLoader = false;
        let lookUpData = JSON.parse(JSON.stringify(res));
        this.allWasher = lookUpData.Washer;
        this.allWashingType = lookUpData.WashingType;
      },(error)=> {
        this.showLoader = false;
        this.notification.error('Error','Error While Lookup Master Data');
      })
    }
    getDetails(id) {
      this.detail = true;
      this.showLoader = true;
      this.washingService.getWashingDetails(id,this.userID).subscribe(res => {
        this.showLoader = false;
        const resp = JSON.parse(JSON.stringify(res));
        this.populateAllData(resp);
      },(err) => {
        this.showLoader = false;
      })
    }

    populateAllData(resp) {
      if(resp.Washing.length) {
        let allValues = resp.Washing[0];
        let ReceiveDateArray = [];
        const WashingDateArray = allValues.WashingDate.split('/');
        if(allValues.ReceiveDate) {
          ReceiveDateArray = allValues.ReceiveDate.split('/')
        }
        this.displayDate = allValues.WashingDate;
        this.createWashing.WashingDate = { year: +WashingDateArray[2], month: +WashingDateArray[0], day: +WashingDateArray[1] };
        this.createWashing.ReceiveDate = ReceiveDateArray.length ? { year: +ReceiveDateArray[2], month: +ReceiveDateArray[0], day: +ReceiveDateArray[1] } : '';
        this.createWashing.LotNo = allValues.LotID;
        this.createWashing.WashingQty = allValues.QtyIssue;
        this.createWashing.ReceiveQty = allValues.QtyReceive;
        this.createWashing.DamageQty = allValues.QtyDamage;
        this.createWashing.Remark = allValues.Remark;
        this.createWashing.LotID = allValues.LotID;
        this.lotNoValue = allValues.SortNO;
        this.createWashing.Status = allValues.Status;
        this.createWashing.Washer = allValues.WasherID;
        this.createWashing.WashingType = allValues.WashingTypeID;
        this.calculateBalance();
      }
    }

    validateData() {
      if(this.createWashing.LotID && this.createWashing.LotID > 0 && this.createWashing.WashingQty > 0 && 
        this.createWashing.Washer > 0 && this.createWashing.WashingType > 0) {
        if(this.createWashing.ReceiveQty) {
          if(this.createWashing.ReceiveDate) {
            return true;
          }
          this.errMessage = 'Please select receive date';
          return false;
        }
        if(this.createWashing.ReceiveDate) {
          if(this.createWashing.ReceiveQty) {
            return true;
          }
          this.errMessage = 'Please select receive quantity';
          return false;
        }
        return true;
      }
      this.errMessage = 'Please fill all the mandatory information !!!';
      return false;
    }

    goToListPage() {
      if (this.cacheService.has("allWashingList")) {
        this.cacheService.set("redirectToWashingList", 'back');
      }
      this.router.navigate(['/pages/washing/list']);
    }
    submitCutting() {
      if(!this.validateData()) {
        this.notification.error('Error', this.errMessage)
        return;
      }
      let postData = {
        "WashingID": +this.WashingID,
        "WashingDate": `${this.createWashing.WashingDate.month}/${this.createWashing.WashingDate.day}/${this.createWashing.WashingDate.year}`,
        "ReceiveDate": this.createWashing.ReceiveDate ? `${this.createWashing.ReceiveDate.month}/${this.createWashing.ReceiveDate.day}/${this.createWashing.ReceiveDate.year}` : '',
        "LotID": this.createWashing.LotID,
        "WasherID": this.createWashing.Washer,
        "WashingTypeID": this.createWashing.WashingType,
        "QtyIssue": this.createWashing.WashingQty,
        "QtyReceive": this.createWashing.ReceiveQty,
        "QtyDamage": this.createWashing.DamageQty,
        "Remark": this.createWashing.Remark,
        "UserID": this.userID,
      }
      this.showLoader = true;
      this.washingService.createWashing(postData).subscribe(res => {
        this.showLoader = false;
        const response = JSON.parse(JSON.stringify(res));
        if(response.Error && response.Error[0].ERROR == 0) {
          if (this.cacheService.has("allWashingList")) {
            this.cacheService.set("redirectAfterWashingSave", 'saved');
            if (this.cacheService.has("listWashingFilterData")) {
              this.cacheService.get("listWashingFilterData").subscribe((res) => {
                let resp = JSON.parse(JSON.stringify(res));
                resp.startDate = this.createWashing.WashingDate;
                resp.endDate = this.createWashing.WashingDate;
                resp.Washer = 1;
                resp.WasherType = 1;
                this.cacheService.set("listWashingFilterData", resp);
              });
            }
          }
          const id = response.Error[0].CuttingID;
          this.notification.success('Success', response.Error[0].Msg);
          this.router.navigate(['/pages/washing/list']);
        } else {
          this.notification.error('Error', response.Error[0].Msg);
        }
      }, err => {
        this.showLoader = false;
        this.notification.error('Error', 'Something went wrong!');
      })
    }
    changeQuantity() {
      this.calculateBalance();
    }
    calculateBalance() {
      if(this.createWashing.WashingQty) {
        if(this.createWashing.ReceiveQty) {
          if(this.createWashing.DamageQty) {
            this.createWashing.BalanceQty = (+this.createWashing.WashingQty) - (+this.createWashing.ReceiveQty) + (+this.createWashing.DamageQty);
          } else {
            this.createWashing.BalanceQty = (+this.createWashing.WashingQty) - (+this.createWashing.ReceiveQty);
          }
        } else {
          this.createWashing.BalanceQty = (+this.createWashing.WashingQty)
        }
      } else {
        this.createWashing.BalanceQty = 0;
      }
    }
    lotNoSelected(item) {
      this.showList = false;
      this.lotNoLists = [];
      this.lotNoKey = `${item.SortNO}`;
      this.createWashing.LotID = item.LotID;
      this.createWashing.WashingQty = item.CuttingQty;
      this.calculateBalance();
    }
}