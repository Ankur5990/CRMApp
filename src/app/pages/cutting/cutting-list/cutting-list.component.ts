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
import { CuttingService } from '../cutting.service';

@Component({
  selector: 'app-cutting-list',
  templateUrl: './cutting-list.component.html',
  styleUrls: ['./cutting-list.component.scss']
})
export class CuttingListComponent implements OnInit {
  cuttingListTask;
  todaysDate;
  buttonAction = false;
  allCuttingList = [];
  allFitType = [];
  noCuttingFound = '';
  refreshMessage = "Please click View button to get latest data";
  showLoader = false;
  lookUpData;
  allCustomer;
  userID;
  searchTerm$ = new Subject<string>();
  results;
  searchCuttingKey = '';
  constructor(protected userService: UserService, private cuttingService: CuttingService,
    private sharedService: SharedService, private activatedRoute: ActivatedRoute,
    protected cacheService: CacheService, protected modalService: NgbModal,
    private notification: NotificationsService, private genericSort: GenericSort) { }

  ngOnInit() {
    this.userID = localStorage.getItem('UserLoginId');
    this.allCuttingList = [];
    this.cuttingListTask = this.cuttingService.getCuttingObject();
    this.cuttingListTask = JSON.parse(JSON.stringify(this.cuttingListTask));
    this.cuttingListTask.searchby = 1;
    this.cuttingListTask.FitType = 1;
    const now = new Date();
    this.todaysDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    this.cuttingListTask.startDate = this.todaysDate;
    this.cuttingListTask.endDate = this.todaysDate;
    if (this.cacheService.has("listCuttingFilterData")) {
      this.cacheService.get("listCuttingFilterData").subscribe((res) => {
        this.cuttingListTask = JSON.parse(JSON.stringify(res));
        if(res.searchby == 1) {
          this.searchCuttingKey = res.searchtext;
        } else {
          this.searchCuttingKey = '';
        }
        if(this.cacheService.has('allCuttingList')) {
          this.cacheService.get('allCuttingList').subscribe(res => {
            this.allCuttingList = JSON.parse(JSON.stringify(res));
          })
        }
      });
    }
    if(this.cacheService.has("redirectToCuttingList")) {
      this.cacheService.deleteCache('redirectToCuttingList');
      this.cacheService.get('allCuttingList').subscribe(res => {
        this.allCuttingList = JSON.parse(JSON.stringify(res));
      })
    }
    if(this.cacheService.has("redirectAfterCuttingSave")) {
      this.cacheService.deleteCache('redirectAfterCuttingSave');
      this.allCuttingList = [];
      if(this.cuttingListTask.searchby == 2) {
        this.validateData();
        if(this.buttonAction) {
          this.getAllCuttings();
        }
      } else if(this.cuttingListTask.searchby == 1) {
        this.showLoader = true;
        this.cuttingService.searchEntries(this.searchCuttingKey, this.userID).subscribe(res => {
          this.showLoader = false;
          if(res['CuttingList'].length == 0) {
            this.allCuttingList = [];
            this.noCuttingFound = "No Cutting Found";
            this.refreshMessage = '';
          } else {
            this.allCuttingList = res['CuttingList'];
            if(res['CuttingList'].length > 0) {
              this.cacheService.set("allCuttingList", this.allCuttingList);
              if(sessionStorage.getItem('searchCuttingValue')) {
                this.cuttingListTask.searchtext = sessionStorage.getItem('searchCuttingValue');
              }
              this.cacheService.set("listCuttingFilterData", this.cuttingListTask);
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
    this.cuttingService.search(this.searchTerm$,this.userID)
    .subscribe(results => {
      if(results['CuttingList'].length == 0) {
        this.allCuttingList = [];
        this.noCuttingFound = "No Cutting Found";
        this.refreshMessage = '';
      } else {
        this.allCuttingList = results['CuttingList'];
        if(results['CuttingList'].length > 0) {
          this.cacheService.set("allCuttingList", this.allCuttingList);
          if(sessionStorage.getItem('searchCuttingValue')) {
            this.cuttingListTask.searchtext = sessionStorage.getItem('searchCuttingValue');
          }
          this.cacheService.set("listCuttingFilterData", this.cuttingListTask);
        }
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

  printTable() {
    var divToPrint = document.getElementById("cutting-container");  
    let newWin = window.open("");  
    newWin.document.write(divToPrint.outerHTML);  
    newWin.print();  
    newWin.close();
  }
  exportToCSV() {
    const report = [];
    this.allCuttingList.forEach((cuttingInfo) => {
      report.push({
        LotNumber: cuttingInfo.LotID,
        SortNO: cuttingInfo.SortNO,
        FitType: cuttingInfo.FitType,
        LengthMeter: cuttingInfo.LengthMeter,
        QtyIssue: cuttingInfo.QtyIssue,
        SampleQty: cuttingInfo.SampleQty,
        NoOfRoll: cuttingInfo.NoOfRoll,
        QtyDamage: cuttingInfo.QtyDamage,
        Average: cuttingInfo.Average,
        CuttingDate: cuttingInfo.CuttingDate,
        Status: cuttingInfo.Status,
        Remark: cuttingInfo.Remark
      });
    });

    const options = { 
      headers: ['Lot Number', 'Sort No', 'Fit Type','Length', 'Issue Quantity', 'Sample Quantity','No Of Rolls','Damage Quantity', 'Average','Cutting Date', 'Status', 'Remark'], 
      nullToEmptyString: true,
    };
    new ngxCsv(report, 'Cutting-List', options);
  }
  refreshDataHandler() {
    this.validateData();
    if (this.allCuttingList.length || this.noCuttingFound != '') {
      this.allCuttingList = [];
      this.noCuttingFound = "";
      this.refreshMessage = "Please click View button to get latest data";
    }
  }

  validateData() {
    if (this.cuttingListTask.ItemType != 0 && this.cuttingListTask.Supplier !=0) {
      this.buttonAction = true;
      return true;
    } else {
      this.buttonAction = false;
      return false;
    }
  }
  valueChange(txt) {
    this.allCuttingList = [];
    if(txt == 'other') {
      this.searchCuttingKey = '';
    }
    if(this.cuttingListTask.searchby == 1) {
      this.refreshMessage = 'Please search to get latest data';
    } else {
      this.refreshMessage = 'Please click View button to get latest data'
    }
  }
  getAllCuttings() {
    const cuttingTask = JSON.parse(JSON.stringify(this.cuttingListTask));
    const startDate = `${cuttingTask.startDate.month}/${cuttingTask.startDate.day}/${cuttingTask.startDate.year}`;
    const endDate = `${cuttingTask.endDate.month}/${cuttingTask.endDate.day}/${cuttingTask.endDate.year}`;
    this.showLoader = true;
    this.cuttingService.getAllCuttings(startDate,endDate, cuttingTask.FitType ,this.userID).subscribe((res) => {
      this.showLoader = false;
      if (!res['CuttingList'].length) {
        this.allCuttingList = [];
        this.noCuttingFound = "No Cutting Found";
      } else {
        this.allCuttingList = res['CuttingList'];
        this.refreshMessage = "";
        this.noCuttingFound = "";
        this.cacheService.set("allCuttingList", this.allCuttingList);
        this.cacheService.set("listCuttingFilterData", this.cuttingListTask);
      }
    },(error) => {
      this.showLoader = false;
      this.allCuttingList = [];
      this.notification.error('Error','Something went wrong, Please try later !!!');
    })
  }
}
