import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../../shared/user.service';
import { GenericSort } from '../../../shared/pipes/generic-sort.pipe';
import { CacheService } from '../../../shared/cache.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import * as _ from 'lodash';
import { MiscIssueService } from '../misc-issue.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-create-misc-issue',
  templateUrl: './create-misc-issue.component.html',
  styleUrls: ['./create-misc-issue.component.scss']
})
export class CreateMiscIssueComponent implements OnInit {
  todaysDate;
  showLoader = false;
  cardTitle = 'Create New Issue';
  isViewOnly = false;
  isEditOnly = false;
  createIssue;
  allVendors = [];
  allItems = [];
  selectedProduct = [];
  allPurchaseList = [];
  allLotsList = [];
  userID = '';
  LotNoKey = '';
  lotNoValue = '';
  PurchaseKey = '';
  PurchaseValue = '';
  IssueID = 0;
  customerDetail = '';
  detail = false;
  disableStatus = false;
  showList = false;
  showPurchaseList = false;
  searchLotNo$ = new Subject<string>();
  searchPurchaseNo$ = new Subject<string>();
  constructor(protected userService: UserService, private issueService: MiscIssueService,
    private router: Router, private activatedRoute: ActivatedRoute,
    protected cacheService: CacheService, protected modalService: NgbModal,
    private notification: NotificationsService, private genericSort: GenericSort) { }

    ngOnInit() {
      const now = new Date();
      this.userID = localStorage.getItem('UserLoginId');
      this.todaysDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
      this.createIssue = this.issueService.getIssueObject();
      this.createIssue = JSON.parse(JSON.stringify(this.createIssue));
      this.disableStatus = true;
      this.createIssue.IssueDate = this.todaysDate;
      this.createIssue.ReceiveDate = '';
      this.createIssue.LotID = 0;
      this.createIssue.PurchaseID = 0;
      this.createIssue.Vendor = 0;
      this.createIssue.IssueType = 0;
      this.createIssue.Remark = '';
      this.createIssue.IsReturn = false;
      this.getMasterData();
      const activatedRouteObject = this.activatedRoute.snapshot.data;
      if(activatedRouteObject['viewMode'] === true) {
        this.detail = true;
        this.isViewOnly = true;
        this.cardTitle = 'View Misc Issue'
        const issueId = this.activatedRoute.snapshot.params.issueId;
        this.IssueID = issueId;
        this.getDetails(issueId);
      } else if(activatedRouteObject['editMode'] === true) {
        this.detail = true;
        this.disableStatus = false;
        this.isEditOnly = true;
        this.cardTitle = 'Edit Misc Issue'
        const issueId = this.activatedRoute.snapshot.params.issueId;
        this.IssueID = issueId;
        this.getDetails(issueId);
      }
      this.issueService.searchList(this.searchLotNo$,this.userID)
      .subscribe(results => {
        this.showList = true;
        if(results['MiscIssueLotList']) {
          this.allLotsList = results['MiscIssueLotList']
        }
      });
      this.issueService.searchPurchaseList(this.searchPurchaseNo$,this.userID)
      .subscribe(results => {
        this.showPurchaseList = true;
        if(results['MiscIssuePurchaseList']) {
          this.allPurchaseList = results['MiscIssuePurchaseList']
        }
      });
      this.selectedProduct.push({ItemID: 0});
    }
    getMasterData() {
      this.showLoader = true;
      this.issueService.getMasterData(this.userID).subscribe(res => {
        this.showLoader = false;
        let lookUpData = JSON.parse(JSON.stringify(res));
        this.allVendors = lookUpData.Vendor;
        this.allItems = JSON.parse(JSON.stringify(lookUpData.Item));
      },(error)=> {
        this.showLoader = false;
        this.notification.error('Error','Error While Lookup Master Data');
      })
    }
    getDetails(id) {
      this.showLoader = true;
      this.issueService.getMiscIssueDetails(id,this.userID).subscribe(res => {
        this.showLoader = false;
        const resp = JSON.parse(JSON.stringify(res));
        this.populateAllData(resp);
      },(err) => {
        this.showLoader = false;
      })
    }

    populateAllData(resp) {
      if(resp.MiscIssue.length) {
        let allValues = resp.MiscIssue[0];
        const IssueDateArray = allValues.MiscIssueDate.split('/');
        const ReceiveDateArray = allValues.ReceiveDate ? allValues.MiscIssueDate.split('/') : '';
        this.createIssue.IssueDate = { year: +IssueDateArray[2], month: +IssueDateArray[0], day: +IssueDateArray[1] };
        this.createIssue.LotID = allValues.LOTID;
        this.createIssue.PurchaseID = allValues.PurchaseID;
        this.createIssue.IssueType = allValues.IssueTypeID;
        this.createIssue.Vendor = allValues.VendorID;
        this.createIssue.Remark = allValues.Remark;
        this.createIssue.IsReturn = allValues.IsReturn;
        this.createIssue.ReceiveDate = ReceiveDateArray ? { year: +ReceiveDateArray[2], month: +ReceiveDateArray[0], day: +ReceiveDateArray[1] } : '';
        this.lotNoValue = allValues.SortNO;
        this.PurchaseValue = allValues.PONumber;
        if(resp.MiscIssueDetail.length) {
          let issueDetails = resp.MiscIssueDetail;
          this.selectedProduct = issueDetails;
        }
      }
    }

    addItemRow() {
      this.selectedProduct.push({ItemID: 0});
    }
  
    onItemChange(item, index) {
      let len = 0;
      if(this.selectedProduct.length > 1) {
        for(let i=0; i< this.selectedProduct.length; i++) {
          if(item.ItemID == this.selectedProduct[i].ItemID){
            len++
            if(len == 2) {
              this.notification.error('This Item was already selected');
              break;
            }
          }
        }
      }
      if(len == 2) {
        setTimeout(()=> {
          this.selectedProduct[index].ItemID = 0;
        },0);
      }
      item.IssueQuantity = '';
      item.ReceiveQuantity = '';
      item.Rate = '';
    }

    validateData() {
      if(this.createIssue.IssueDate && this.createIssue.IssueType > 0 && this.createIssue.Vendor > 0 && this.validateItems()) {
          return true;
        }
      return false;
    }
    validateItems() {
      if(this.selectedProduct.length == 0) {
        return false;
      }
      for(let i=0; i< this.selectedProduct.length; i++) {
        // || (this.selectedProduct[i].IssueQuantity == 0)
        if((!this.selectedProduct[i].ItemID || this.selectedProduct[i].ItemID == 0) || (!this.selectedProduct[i].IssueQuantity) || (this.selectedProduct[i].IssueQuantity == 0) || (!this.selectedProduct[i].Rate || this.selectedProduct[i].Rate == 0)) {
          return false;
        }
      }
      return true
    }
    goToListPage() {
      if (this.cacheService.has("allIssueList")) {
        this.cacheService.set("redirectToIssueList", 'back');
      }
      this.router.navigate(['/pages/issue/list']);
    }
    submitMiscIssue() {
      if(!this.validateData()) {
        this.notification.error('Error', 'Please fill all the mandatory information !!!')
        return;
      }
      let receiveDate = '';
      receiveDate = this.createIssue.ReceiveDate ? `${this.createIssue.ReceiveDate.month}/${this.createIssue.ReceiveDate.day}/${this.createIssue.ReceiveDate.year}`: '';
      // let issueDetails = []
      // for(let i=0; i< this.selectedProduct.length; i++) {
      //   issueDetails.push({ItemID: this.selectedProduct[i].ItemID, IssueQuantity: this.selectedProduct[i].IssueQuantity,
      //     ReceiveQuantity: this.selectedProduct[i].ReceiveQuantity, Rate: this.selectedProduct[i].Rate});
      // }
      let postData = {
        "MiscIssueID": +this.IssueID,
        "MiscIssueDate": `${this.createIssue.IssueDate.month}/${this.createIssue.IssueDate.day}/${this.createIssue.IssueDate.year}`,
        "IssueTypeID": this.createIssue.IssueType,
        "LOTID": this.createIssue.LotID,
        "PurchaseID": this.createIssue.PurchaseID,
        "IsReturn": this.createIssue.IsReturn == true ? 1 : 0,
        "VendorID": this.createIssue.Vendor,
        "ReceiveDate": receiveDate,
        "Remark": this.createIssue.Remark,
        "CreatedBy": this.userID,
        "MIDetail": this.selectedProduct
      }
      this.showLoader = true;
      this.issueService.createMiscIssue(postData).subscribe(res => {
        this.showLoader = false;
        const response = JSON.parse(JSON.stringify(res));
        if(response.Error && response.Error[0].ERROR == 0) {
          if (this.cacheService.has("allIssueList")) {
            this.cacheService.set("redirectAfterIssueSave", 'saved');
            if (this.cacheService.has("listIssueFilterData")) {
              this.cacheService.get("listIssueFilterData").subscribe((res) => {
                let resp = JSON.parse(JSON.stringify(res));
                resp.IssueType = 0;
                resp.Vendor = 1;
                resp.startDate = this.createIssue.IssueDate;
                resp.endDate = this.createIssue.IssueDate;
                this.cacheService.set("listIssueFilterData", resp);
              });
            }
          }
          const id = response.Error[0].PurchaseID;
          this.notification.success('Success', response.Error[0].Msg);
          this.router.navigate(['/pages/issue/list']);
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
    lotNoSelected(item) {
      this.LotNoKey = item.SortNO;
      this.createIssue.LotID = item.LotID;
      this.showList = false;
      this.allLotsList = [];
    }
    PurchaseSelected(item) {
      this.PurchaseKey = item.PONumber;
      this.createIssue.PurchaseID = item.PurchaseID;
      this.showPurchaseList = false;
      this.allPurchaseList = [];
    }

    // removeZero(item, key) {
    //   if(item.Quantity == 0 && key == 'quantity') {
    //     item.Quantity = '';
    //   } else if(item.Rate == 0 && key == 'price') {
    //     item.Rate = '';
    //   } else if(this.createIssue.RefInvoiceNumber == 0 && key == 'ref') {
    //     this.createIssue.RefInvoiceNumber = '';
    //   }
    // }
    // addZero(item, key) {
    //   if(item.Quantity == '' && key == 'quantity') {
    //     item.Quantity = 0;
    //   }else if(item.Rate == '' && key == 'price') {
    //     item.Rate = 0;
    //   } else if(this.createIssue.RefInvoiceNumber == '' && key == 'ref') {
    //     this.createIssue.RefInvoiceNumber = 0;
    //   }
    // }
}