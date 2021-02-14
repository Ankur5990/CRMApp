import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../shared/user.service';
import { NotificationsService } from 'angular2-notifications';
import { GenericSort } from 'app/shared/pipes/generic-sort.pipe';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CacheService } from 'app/shared/cache.service';
import { SharedService } from 'app/shared/shared.service';
import { ActivatedRoute } from '@angular/router';
import { ngxCsv } from 'ngx-csv/ngx-csv';
import { Subject } from 'rxjs';
import { CostingService } from '../costing.service';

@Component({
  selector: 'app-costing-list',
  templateUrl: './costing-list.component.html',
  styleUrls: ['./costing-list.component.scss']
})
export class CostingListComponent implements OnInit {
  costingListTask;
  todaysDate;
  buttonAction = false;
  allCostingList = [];
  allProductType = [];
  noCostingFound = '';
  refreshMessage = "Please click View button to get latest data";
  showLoader = false;
  lookUpData;
  allCustomer;
  userID;
  searchCostingTerm$ = new Subject<string>();
  results;
  searchCostingKey = '';
  constructor(protected userService: UserService, private costingService: CostingService,
    private sharedService: SharedService, private activatedRoute: ActivatedRoute,
    protected cacheService: CacheService, protected modalService: NgbModal,
    private notification: NotificationsService, private genericSort: GenericSort) { }

  ngOnInit() {
    this.userID = localStorage.getItem('UserLoginId');
    this.allCostingList = [];
    this.costingListTask = this.costingService.getCostingObject();
    this.costingListTask = JSON.parse(JSON.stringify(this.costingListTask));
    this.costingListTask.ProductType = 1;
    this.costingListTask.FitType = 1;
    this.costingListTask.searchBy = 1;
    const now = new Date();
    this.todaysDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    this.costingListTask.startDate = this.todaysDate;
    this.costingListTask.endDate = this.todaysDate;
    if (this.cacheService.has("listCostingFilterData")) {
      this.cacheService.get("listCostingFilterData").subscribe((res) => {
        this.costingListTask = JSON.parse(JSON.stringify(res));
        if(res.searchby == 1) {
          this.searchCostingKey = res.searchtext;
        } else {
          this.searchCostingKey = '';
        }
        if(this.cacheService.has('allCostingList')) {
          this.cacheService.get('allCostingList').subscribe(res => {
            this.allCostingList = JSON.parse(JSON.stringify(res));
          })
        }
      });
    }
    if(this.cacheService.has("redirectToCostingList")) {
      this.cacheService.deleteCache('redirectToCostingList');
      this.cacheService.get('allCostingList').subscribe(res => {
        this.allCostingList = JSON.parse(JSON.stringify(res));
      })
    }
    if(this.cacheService.has("redirectAfterCostingSave")) {
      this.cacheService.deleteCache('redirectAfterCostingSave');
      this.allCostingList = [];
      if(this.costingListTask.searchby == 2) {
        this.validateData();
        if(this.buttonAction) {
          this.getAllCostings();
        }
      } else if(this.costingListTask.searchby == 1) {
        this.showLoader = true;
        this.costingService.searchEntries(this.searchCostingKey, this.userID).subscribe(res => {
          this.showLoader = false;
          if(res['PurchaseOrderList'].length == 0) {
            this.allCostingList = [];
            this.noCostingFound = "No Purchase Order Found";
            this.refreshMessage = '';
          } else {
            this.allCostingList = res['PurchaseOrderList'];
            if(res['PurchaseOrderList'].length > 0) {
              this.cacheService.set("allCostingList", this.allCostingList);
              if(sessionStorage.getItem('searchCostingValue')) {
                this.costingListTask.searchtext = sessionStorage.getItem('searchCostingValue');
              }
              this.cacheService.set("listCostingFilterData", this.costingListTask);
            }
          }
        }, err=> {
          this.showLoader = false;
          this.notification.error('Error', 'Having Problem in loading latest data !!!');
        })
      }
    }
    this.getMasterData();                    
    this.validateData();
    this.costingService.search(this.searchCostingTerm$,this.userID)
    .subscribe(results => {
      if(results['CostingList'].length == 0) {
        this.allCostingList = [];
        this.noCostingFound = "No Costing Found";
        this.refreshMessage = '';
      } else {
        this.allCostingList = results['CostingList'];
        if(results['CostingList'].length > 0) {
          this.cacheService.set("allCostingList", this.allCostingList);
          if(sessionStorage.getItem('searchCostingValue')) {
            this.costingListTask.searchtext = sessionStorage.getItem('searchCostingValue');
          }
          this.cacheService.set("listCostingFilterData", this.costingListTask);
        }
      }
    });
  }

  getMasterData() {
    this.showLoader = true;
    this.costingService.getMasterData().subscribe(res => {
      this.showLoader = false;
      let lookUpData = JSON.parse(JSON.stringify(res));
      this.allProductType = lookUpData.ProductType;
    },(error)=> {
      this.showLoader = false;
      this.notification.error('Error','Error While Lookup Master Data');
    })
  }

  printTable() {
    var divToPrint = document.getElementById("costing-container");  
    let newWin = window.open("");  
    newWin.document.write(divToPrint.outerHTML);  
    newWin.print();  
    newWin.close();
  }
  exportToCSV() {
    const report = [];
    this.allCostingList.forEach((costingInfo) => {
      report.push({
        LotID: costingInfo.LotID,
        ProductType: costingInfo.ProductType,
        FabricCost: costingInfo.FabricCost,
        TailorCost: costingInfo.TailorCost,
        ExtraTailorCost: costingInfo.ExtraTailorCost,
        ThreadCost: costingInfo.ThreadCost,
        LiningCost: costingInfo.LiningCost,
        TrimsCost: costingInfo.TrimsCost,
        ZIPCost: costingInfo.ZIPCost,
        FinishingCost: costingInfo.FinishingCost,
        OverheadsCost: costingInfo.OverheadsCost,
        ExtraCost: costingInfo.ExtraCost,
        GSTPercentage: costingInfo.GSTPercentage,
        UserName: costingInfo.USERNAME,
        CostingDate: costingInfo.CostingDate,
        Status: costingInfo.Status
      });
    });

    const options = { 
      headers: ['Lot No', 'Product Type','Fabric Cost','Fabric Cost','Tailor Cost','Extra Tailor Cost','Thread Cost','Lining Cost','Trims Cost','ZIP Cost','Finishing Cost','Overheads Cost','Extra Cost','GST Percentage', 'User Name', 'Costing Date','Status'], 
      nullToEmptyString: true,
    };
    new ngxCsv(report, 'Costing-List', options);
  }
  refreshDataHandler() {
    this.validateData();
    if (this.allCostingList.length || this.noCostingFound != '') {
      this.allCostingList = [];
      this.noCostingFound = "";
      this.refreshMessage = "Please click View button to get latest data";
    }
  }

  validateData() {
    if (this.costingListTask.ProductType != 0) {
      this.buttonAction = true;
      return true;
    } else {
      this.buttonAction = false;
      return false;
    }
  }
  valueChange(txt) {
    this.allCostingList = [];
    if(txt == 'other') {
      this.searchCostingKey = '';
    }
    if(this.costingListTask.searchby == 1) {
      this.refreshMessage = 'Please search to get latest data';
    } else {
      this.refreshMessage = 'Please click View button to get latest data'
    }
  }
  getAllCostings() {
    const costingTask = JSON.parse(JSON.stringify(this.costingListTask));
    const startDate = `${costingTask.startDate.month}/${costingTask.startDate.day}/${costingTask.startDate.year}`;
    const endDate = `${costingTask.endDate.month}/${costingTask.endDate.day}/${costingTask.endDate.year}`;
    this.showLoader = true;
    this.costingService.getAllCostings(startDate,endDate,costingTask.ProductType,costingTask.FitType, this.userID).subscribe((res) => {
      this.showLoader = false;
      if (!res['CostingList'].length) {
        this.allCostingList = [];
        this.noCostingFound = "No Costing Found";
      } else {
        this.allCostingList = res['CostingList'];
        this.refreshMessage = "";
        this.noCostingFound = "";
        this.cacheService.set("allCostingList", this.allCostingList);
        this.cacheService.set("listCostingFilterData", this.costingListTask);
      }
    },(error) => {
      this.showLoader = false;
      this.allCostingList = [];
      this.notification.error('Error','Something went wrong, Please try later !!!');
    })
  }
}
