import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LeadService } from '../leads.service';
import { UserService } from '../../../shared/user.service';
import { GenericSort } from '../../../shared/pipes/generic-sort.pipe';
import { CacheService } from '../../../shared/cache.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-create-lead',
  templateUrl: './create-leads.component.html',
  styleUrls: ['./create-leads.component.scss']
})
export class CreateLeadComponent implements OnInit {
  todaysDate;
  showLoader = false;
  cardTitle = 'CREATE NEW LEAD';
  isViewOnly = false;
  isEditOnly = false;
  createLead;
  commentList = [];
  allCustomer = [];
  totalStatus = [];
  allStatus = [];
  allLeadSource = [];
  allCities = [];
  allState = [];
  allLeadTypes = [];
  totalCities = [];
  userID = '';
  LeadID = 0;
  disableStatus = false;
  filterStateData = false;
  IsfollowUpDate = false;

  constructor(protected userService: UserService, private leadService: LeadService,
    private router: Router, private activatedRoute: ActivatedRoute,
    protected cacheService: CacheService, protected modalService: NgbModal,
    private notification: NotificationsService, private genericSort: GenericSort) { }

    ngOnInit() {
      const now = new Date();
      this.userID = localStorage.getItem('UserLoginId');
      this.todaysDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
      this.createLead = this.leadService.getLeadObject();
      this.createLead = JSON.parse(JSON.stringify(this.createLead));
      this.disableStatus = true;
      this.createLead.LeadDate = this.todaysDate;
      this.createLead.FollowUpDate = '';
      this.createLead.LeadNo = '';
      this.createLead.LeadSourceId = 0;
      this.createLead.CustomerName = '';
      this.createLead.ShopName = '';
      this.createLead.LeadType = 0;
      this.createLead.LeadStatus = "L";
      this.createLead.Priority = 2;
      this.createLead.PhoneNo = '';
      this.createLead.Qunatity = '';
      this.createLead.Address = '';
      this.createLead.State = 0;
      this.createLead.City = 0;
      this.createLead.ZipCode = '';
      this.createLead.Comment = '';
      this.getMasterData();
      const activatedRouteObject = this.activatedRoute.snapshot.data;
      if(activatedRouteObject['viewMode'] === true) {
        this.isViewOnly = true;
        this.cardTitle = 'VIEW LEAD'
        const leadId = this.activatedRoute.snapshot.params.leadId;
        this.LeadID = leadId;
        this.getDetails(leadId);
      } else if(activatedRouteObject['editMode'] === true) {
        this.disableStatus = false;
        this.isEditOnly = true;
        this.cardTitle = 'EDIT LEAD'
        const leadId = this.activatedRoute.snapshot.params.leadId;
        this.LeadID = leadId;
        this.getDetails(leadId);
      }
    }
    getMasterData() {
      this.showLoader = true;
      this.leadService.getMasterData().subscribe(res => {
        this.showLoader = false;
        let lookUpData = JSON.parse(JSON.stringify(res));
        this.allCustomer = lookUpData.Customer;
        this.totalStatus = JSON.parse(JSON.stringify(lookUpData.LeadStatus));
        this.allStatus = lookUpData.LeadStatus;
        this.allState = lookUpData.State;
        this.allLeadSource = lookUpData.LeadSource;
        this.totalCities = lookUpData.City;
        this.allLeadTypes = lookUpData.LeadType;
        if(this.filterStateData == true && (this.isEditOnly || this.isViewOnly)) {
          this.refreshDataHandler('statechange');
        }
        if(this.filterStateData == true && this.isEditOnly) {
          if(this.IsfollowUpDate == true) {
            let showOnlyStatus = this.totalStatus.filter(x => x.Code == 'F' || x.Code == 'D');
            this.allStatus = showOnlyStatus;
          } else {
            let showOnlyStatus = this.totalStatus.filter(x => x.Code == 'L' || x.Code == 'D');
            this.allStatus = showOnlyStatus;
          }
          if(this.createLead.LeadStatus == 'W') {
            this.allStatus = this.totalStatus;
          }
        }
      },(error)=> {
        this.showLoader = false;
        this.notification.error('Error','Error While Lookup Master Data');
      })
    }
    getDetails(id) {
      this.showLoader = true;
      this.leadService.getLeadDetails(id,this.userID).subscribe(res => {
        this.showLoader = false;
        const resp = JSON.parse(JSON.stringify(res));
        this.populateAllData(resp);
      },(err) => {
        this.showLoader = false;
      })
    }
    followUpChangeHandler() {
      this.disableStatus = true;
      if(this.isEditOnly) {
        let findResult = this.totalStatus.find(x => x.Code == 'F');
        if(!this.allStatus.find(x=> x.Code == 'F')) {
          this.allStatus.push(findResult);
        }
      }
      if(!this.createLead.FollowUpDate || !this.createLead.FollowUpDate.day) {
        this.createLead.LeadStatus = 'L';
      } else {
        this.createLead.LeadStatus = 'F';
      }
    }
    populateAllData(resp) {
      if(resp.Lead.length) {
        let allValues = resp.Lead[0];
        let followUpDate;
        const leadDateArray = allValues.LeadDate.split('/');
        if(allValues.FollowUPDate) {
          const followupDateArray = allValues.FollowUPDate.split('/')
          followUpDate = { year: +followupDateArray[2], month: +followupDateArray[0], day: +followupDateArray[1] };
          if(this.allStatus.length == 0) {
            this.IsfollowUpDate = true;
            this.filterStateData = true;
          }
          let showOnlyStatus = this.totalStatus.filter(x => x.Code == 'F' || x.Code == 'D');
          this.allStatus = showOnlyStatus;
        } else {
          followUpDate = '';
          if(this.allStatus.length == 0) {
            this.IsfollowUpDate = false;
            this.filterStateData = true;
          }
          let showOnlyStatus = this.totalStatus.filter(x => x.Code == 'L' || x.Code == 'D');
          this.allStatus = showOnlyStatus;
        }
        this.createLead.LeadDate = { year: +leadDateArray[2], month: +leadDateArray[0], day: +leadDateArray[1] };
        this.createLead.FollowUpDate = followUpDate
        this.createLead.LeadNo = allValues.LeadNumber;
        this.createLead.LeadSourceId = allValues.LeadSourceID;
        this.createLead.CustomerName = allValues.CustomerName;
        this.createLead.ShopName = allValues.ShopName;
        this.createLead.LeadType = allValues.LeadTypeID;
        this.createLead.LeadStatus = allValues.LeadStatusCode;
        if(allValues.LeadStatusCode == 'W') {
          const status = this.totalStatus.filter(x => x.Code == 'W');
          this.allStatus = status;
        }
        this.createLead.Priority = allValues.PriorityID;
        this.createLead.PhoneNo = allValues.Phone;
        this.createLead.Qunatity = allValues.Quantity;
        this.createLead.Address = allValues.Address;
        this.createLead.State = allValues.StateID;
        this.refreshDataHandler('statechange');
        this.createLead.City = allValues.CityID;
        this.createLead.ZipCode = allValues.Zip;
        this.createLead.Comment = '';
      }
      this.commentList = resp.LeadComment;
    }
  
    refreshDataHandler(byType: any = '') {
      if(byType === "statechange"){
        this.allCities = this.totalCities.filter(x=> x.StateID == this.createLead.State);
      }
    }

    validateData() {
      if(this.createLead.LeadType != 0 && this.createLead.LeadSourceId != 0 && this.createLead.LeadStatus != 0 
        && this.createLead.CustomerName != '' && this.createLead.PhoneNo != '' && this.createLead.Qunatity != '' 
        && this.createLead.Address != '' && this.createLead.State != 0 && this.createLead.City != 0) {
          return true;
        }
      return false;
    }
    goToListPage() {
      this.router.navigate(['/pages/leads/list']);
    }
    submitLead() {
      if(!this.validateData()) {
        this.notification.error('Error', 'Please fill all the mandatory information !!!')
        return;
      }
      let findResult = this.totalStatus.find(x => x.Code == this.createLead.LeadStatus);
      let postData = {
        "LeadID": this.LeadID,
        "LeadDate": `${this.createLead.LeadDate.month}/${this.createLead.LeadDate.day}/${this.createLead.LeadDate.year}`,
        "FollowupDate": `${this.createLead.FollowUpDate.month}/${this.createLead.FollowUpDate.day}/${this.createLead.FollowUpDate.year}`,
        "CustomerName": this.createLead.CustomerName,
        "Address": this.createLead.Address,
        "Zip": this.createLead.ZipCode,
        "StateID": this.createLead.State,
        "CityID": this.createLead.City,
        "Phone": this.createLead.PhoneNo,
        "LeadTypeID": this.createLead.LeadType,
        "Quantity": this.createLead.Qunatity,
        "LeadSourceID": this.createLead.LeadSourceId,
        "PriorityID": this.createLead.Priority,
        "ShopName": this.createLead.ShopName,
        "LeadStatusID": findResult.LeadStatusID,
        "UserID": this.userID,
        "Comment": this.createLead.Comment
      }
      this.showLoader = true;
      this.leadService.createLead(postData).subscribe(res => {
        this.showLoader = false;
        const resp = JSON.parse(JSON.stringify(res));
        if(resp.Error[0].ERROR == 0) {
          this.notification.success('Success', resp.Error[0].Msg);
          this.router.navigate(['pages/leads/list']);
        } else {
          this.notification.error('Error', resp.Error[0].Msg);
        }
      }, err => {
        this.showLoader = false;
        this.notification.error('Error', 'Something went wrong!');
      })
    }
}