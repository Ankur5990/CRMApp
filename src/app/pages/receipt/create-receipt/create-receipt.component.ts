import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../../shared/user.service';
import { GenericSort } from '../../../shared/pipes/generic-sort.pipe';
import { CacheService } from '../../../shared/cache.service';
import * as _ from 'lodash';
import { Subject } from 'rxjs';
import { ReceiptService } from '../receipt.service';

@Component({
  selector: 'app-create-receipt',
  templateUrl: './create-receipt.component.html',
  styleUrls: ['./create-receipt.component.scss']
})
export class CreateReceiptComponent implements OnInit {
  todaysDate;
  showLoader = false;
  cardTitle = 'CREATE NEW Receipt';
  isViewOnly = false;
  isEditOnly = false;
  createReceipt;
  allVendor = [];
  allReceiptType = [];
  customerNameWithAddress = '';
  userID = '';
  ReceiptID = 0;
  detail = false;
  displayDate = '';
  errMessage = 'Please fill all the mandatory information !!!';
  showList = false;
  customerList = [];
  searchKey = '';
  searchCustomer$ = new Subject<string>();

  constructor(protected userService: UserService, private receiptService: ReceiptService,
    private router: Router, private activatedRoute: ActivatedRoute,
    protected cacheService: CacheService, protected modalService: NgbModal,
    private notification: NotificationsService, private genericSort: GenericSort) { }

    ngOnInit() {
      const now = new Date();
      this.userID = localStorage.getItem('UserLoginId');
      this.todaysDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
      this.createReceipt = this.receiptService.getReceiptObject();
      this.createReceipt = JSON.parse(JSON.stringify(this.createReceipt));
      this.createReceipt.ReceiptDate = this.todaysDate;
      this.createReceipt.ReceiptNumber = '';
      this.createReceipt.PartyTypeID = 3;
      this.createReceipt.VendorID = 0;
      this.createReceipt.CustomerID = 0;
      this.createReceipt.ReceiptTypeID = 0;
      this.createReceipt.TranTypeID = 0;
      this.createReceipt.Remark = '';
      this.createReceipt.Amount = '';
      this.getMasterData();
      const activatedRouteObject = this.activatedRoute.snapshot.data;
      if(activatedRouteObject['viewMode'] === true) {
        this.isViewOnly = true;
        this.cardTitle = 'View Receipt';
        const receiptId = this.activatedRoute.snapshot.params.receiptId;
        this.ReceiptID = receiptId;
        this.getDetails(receiptId);
      } else if(activatedRouteObject['editMode'] === true) {
        this.isEditOnly = true;
        this.cardTitle = 'Edit Receipt';
        const receiptId = this.activatedRoute.snapshot.params.receiptId;
        this.ReceiptID = receiptId;
        this.getDetails(receiptId);
      }
      this.receiptService.searchCustomer(this.searchCustomer$,this.userID)
      .subscribe(results => {
        this.showList = true;
        if(results['Customer']) {
          this.customerList = results['Customer']
        }
      });
    }
    getMasterData() {
      this.showLoader = true;
      this.receiptService.getReceiptMasterData().subscribe(res => {
        this.showLoader = false;
        let lookUpData = JSON.parse(JSON.stringify(res));
        this.allVendor = lookUpData.Vendor;
        this.allReceiptType = lookUpData.ReceiptType;
      },(error)=> {
        this.showLoader = false;
        this.notification.error('Error','Error While Lookup Receipt Master Data');
      })
    }
    getDetails(id) {
      this.detail = true;
      this.showLoader = true;
      this.receiptService.getReceiptDetails(id,this.userID).subscribe(res => {
        this.showLoader = false;
        const resp = JSON.parse(JSON.stringify(res));
        this.populateAllData(resp);
      },(err) => {
        this.showLoader = false;
      })
    }

    populateAllData(resp) {
      if(resp.Receipt.length) {
        let allValues = resp.Receipt[0];
        const ReceiptDateArray = allValues.ReceiptDate.split('/');
        this.displayDate = allValues.ReceiptDate;
        this.createReceipt.ReceiptDate = { year: +ReceiptDateArray[2], month: +ReceiptDateArray[0], day: +ReceiptDateArray[1] };
        this.customerNameWithAddress = allValues.Party;
        this.createReceipt.ReceiptNumber = allValues.ReceiptNumber;
        this.createReceipt.PartyTypeID = allValues.PartyTypeID;
        this.createReceipt.PartyID = allValues.PartyID;
        this.createReceipt.ReceiptTypeID = allValues.ReceiptTypeID;
        this.createReceipt.TranTypeID = allValues.TranTypeID;
        this.createReceipt.Remark = allValues.Remark;
        this.createReceipt.Amount = allValues.Amount;
      }
    }

    validateData() {
      if(this.createReceipt.ReceiptTypeID && this.createReceipt.ReceiptTypeID > 0 && this.createReceipt.PartyTypeID > 0 && 
        (this.createReceipt.VendorID > 0 || this.createReceipt.CustomerID > 0)) {
        return true;
      }
      this.errMessage = 'Please fill all the mandatory information !!!';
      return false;
    }

    goToListPage() {
      if (this.cacheService.has("allReceiptList")) {
        this.cacheService.set("redirectToReceiptList", 'back');
      }
      this.router.navigate(['/pages/receipt/list']);
    }
    submitReceipt() {
      if(!this.validateData()) {
        this.notification.error('Error', this.errMessage)
        return;
      }
      let PartyID = this.createReceipt.PartyID;
      if(!this.detail) {
        PartyID == 2 ? this.createReceipt.VendorID : this.createReceipt.CustomerID;
      }
      let postData = {
        "ReceiptID": +this.ReceiptID,
        "ReceiptDate": `${this.createReceipt.ReceiptDate.month}/${this.createReceipt.ReceiptDate.day}/${this.createReceipt.ReceiptDate.year}`,
        "PartyTypeID": this.createReceipt.PartyTypeID,
        "ReceiptTypeID": this.createReceipt.ReceiptTypeID,
        "PartyID": PartyID,
        "TranTypeID": this.createReceipt.TranTypeID,
        "Remark": this.createReceipt.Remark,
        "Amount": this.createReceipt.Amount,
        "UserID": this.userID,
      }
      this.showLoader = true;
      this.receiptService.createReceipt(postData).subscribe(res => {
        this.showLoader = false;
        const response = JSON.parse(JSON.stringify(res));
        if(response.Error && response.Error[0].ERROR == 0) {
          if (this.cacheService.has("allReceiptList")) {
            this.cacheService.set("redirectAfterReceiptSave", 'saved');
            if (this.cacheService.has("listReceiptFilterData")) {
              this.cacheService.get("listReceiptFilterData").subscribe((res) => {
                let resp = JSON.parse(JSON.stringify(res));
                resp.startDate = this.createReceipt.ReceiptDate;
                resp.endDate = this.createReceipt.ReceiptDate;
                resp.Washer = 1;
                resp.WasherType = 1;
                this.cacheService.set("listReceiptFilterData", resp);
              });
            }
          }
          this.notification.success('Success', 'Receipt Created Successfully');
          this.router.navigate(['/pages/receipt/list']);
        } else {
          this.notification.error('Error', response.Error[0].Msg);
        }
      }, err => {
        this.showLoader = false;
        this.notification.error('Error', 'Something went wrong!');
      })
    }

    customerSelected(item) {
      this.showList = false;
      this.customerList = [];
      this.searchKey = `${item.CustomerName}`;
      if(item.Address) {
        this.searchKey = this.searchKey + `,${item.Address}`;
      }
      this.createReceipt.CustomerID = item.ID;
    }
}
