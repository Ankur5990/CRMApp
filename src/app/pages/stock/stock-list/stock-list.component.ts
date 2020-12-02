import { Component, OnInit } from '@angular/core';
import { NotificationsService } from 'angular2-notifications';
import { ngxCsv } from 'ngx-csv/ngx-csv';
import { StockService } from '../stock.service';
import { CacheService } from '../../../shared/cache.service';

@Component({
  selector: 'app-stock-list',
  templateUrl: './stock-list.component.html',
  styleUrls: ['./stock-list.component.scss']
})
export class StockListComponent implements OnInit {
  stockTask;
  todaysDate;
  buttonAction = false;
  allStocksList = [];
  noStockFound = '';
  refreshMessage = "Please click View button to get latest data";
  showLoader = false;
  lookUpData;
  allWashers = [];
  userID = '';
  constructor(private stockService: StockService,private notification: NotificationsService, private cacheService: CacheService) { }

  ngOnInit() {
    this.userID = localStorage.getItem('UserLoginId');
    this.allStocksList = [];
    this.stockTask = this.stockService.getOrdersObject();
    this.stockTask = JSON.parse(JSON.stringify(this.stockTask));
    this.stockTask.Washer = 1;
    const now = new Date();
    this.todaysDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    this.stockTask.startDate = this.todaysDate;
    this.stockTask.endDate = this.todaysDate;
    if (this.cacheService.has("stockFilterData")) {
      this.cacheService.get("stockFilterData").subscribe((res) => {
        this.stockTask = JSON.parse(JSON.stringify(res));
        if(this.cacheService.has('allStocksList')) {
          this.cacheService.get('allStocksList').subscribe(res => {
            this.allStocksList = JSON.parse(JSON.stringify(res));
          })
        }
      });
    }
    if(this.cacheService.has("backToStockList")) {
      this.cacheService.deleteCache('backToStockList');
      this.cacheService.get('allStocksList').subscribe(res => {
        this.allStocksList = JSON.parse(JSON.stringify(res));
      })
    }
    if(this.cacheService.has("redirectAfterStockSave")) {
      this.cacheService.deleteCache('redirectAfterStockSave');
      this.allStocksList = [];
      this.validateData();
      if(this.buttonAction) {
        this.getAllStocks();
      }
    }
    this.getWasherData();                    
    this.validateData();
  }

  getWasherData() {
    this.showLoader = true;
    this.stockService.getWasherData().subscribe(res => {
      this.showLoader = false;
      let lookUpData = JSON.parse(JSON.stringify(res));
      this.allWashers = lookUpData.Washer;
    },(error)=> {
      this.showLoader = false;
      this.notification.error('Error','Error While Lookup Master Data');
    })
  }

  refreshDataHandler() {
    this.validateData();
    if (this.allStocksList.length || this.noStockFound != '') {
      this.allStocksList = [];
      this.noStockFound = "";
      this.refreshMessage = "Please click View button to get latest data";
    }
  }

  validateData() {
    if (this.stockTask.Washer != '') {
      this.buttonAction = true;
      return true;
    } else {
      this.buttonAction = false;
      return false;
    }
  }

  getAllStocks() {
    const stockTask = JSON.parse(JSON.stringify(this.stockTask));
    const startDate = `${stockTask.startDate.month}/${stockTask.startDate.day}/${stockTask.startDate.year}`;
    const endDate = `${stockTask.endDate.month}/${stockTask.endDate.day}/${stockTask.endDate.year}`;
    this.showLoader = true;
    this.stockService.getAllStocks(startDate,endDate,stockTask.Washer,this.userID).subscribe((res) => {
      this.showLoader = false;
      console.log(res);
      if (!res['StockList'].length) {
        this.allStocksList = [];
        this.noStockFound = "No Stock Found";
      } else {
        this.allStocksList = res['StockList'];
        this.refreshMessage = "";
        this.noStockFound = "";
        this.cacheService.set("allStocksList", this.allStocksList);
        this.cacheService.set("stockFilterData", this.stockTask);
      }
    },(error) => {
      this.showLoader = false;
      this.allStocksList = [];
      this.notification.error('Error','Something went wrong, Please try later !!!');
    })
  }
  printTable() {
    var divToPrint = document.getElementById("stock-table");
    let newWin = window.open("");  
    newWin.document.write(divToPrint.outerHTML);  
    newWin.print();  
    newWin.close();
  }
  exportToCSV() {
    const report = [];
    this.allStocksList.forEach((stockInfo) => {
      report.push({
        StockDate: stockInfo.StockDate,
        LotNo: stockInfo.LotNo,
        Washer: stockInfo.Washer,
        Washing: stockInfo.Washing,
        Rate: stockInfo.Rate,
        CuttingQty: stockInfo.CuttingQty,
        SampleQty: stockInfo.SampleQty,
        IssueQty: stockInfo.IssueQty,
        ReceiveQty: stockInfo.ReceiveQty,
        GRN: stockInfo.GRN,
        Balance: stockInfo.Balance
      });
    });

    const options = { 
      headers: ['Stock Date','Lot Number','Washer','Washing', 'Rate','Cutting Quantity','Sample Quantity','Issue Quantity', 'Receive Quantity','GRN','Balance'], 
      nullToEmptyString: true,
    };
    new ngxCsv(report, 'Stock-List', options);
  }
}
