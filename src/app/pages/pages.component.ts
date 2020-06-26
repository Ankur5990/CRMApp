import { Component,OnInit } from '@angular/core';
import { NavigationEnd,Router, Routes } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BaMenuService } from '../theme';
import { PAGES_MENU } from './pages.menu';
import { PagesService } from './pages.service';
import { FollowUpModalComponent } from './followupModal/followupModal.component';

@Component({
  selector: 'pages',
  template: `
    <ba-sidebar></ba-sidebar>
    <ba-page-top [userDetails]="userDetails"></ba-page-top>
    <div class="al-main">
      <div class="al-content">
        <router-outlet></router-outlet>
      </div>
    </div>
    <footer class="al-footer clearfix">

    </footer>
    <ba-back-top position="200"></ba-back-top>
    `
})
export class PagesComponent implements OnInit {
  userDetails;
  _onRouteChange: any;
  _redirectToHome: boolean = false;
  constructor(
    private _menuService: BaMenuService,
    private router: Router,
    private modalService: NgbModal,
    private pagesService: PagesService) {
	
  }

  
  ngOnInit() {
    this.getFollowUpDetails();
    let pages
    pages = PAGES_MENU.reduce((acc, menu) => ([
      {
        ...menu,
        children: menu.children.reduce((accumulator, child) => {
            return [
              ...accumulator,
              child,
            ];
        }, []),
      },
    ]), []);
    this._menuService.updateMenuByRoutes(<Routes>pages); 
    if(this.router.url === '/pages') {
      this.router.navigateByUrl(`/pages/${pages[0].children[0].path}`);
    } else {
      this.router.navigate([this.router.url]);
    }
    this._onRouteChange = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this._redirectToHome = event.urlAfterRedirects === '/pages';
        this._onRouteChange.unsubscribe();
      }
    });
  }
  getFollowUpDetails() {
    this.pagesService.getFollowUpList().subscribe(res => {
      if(res['followupLeadList'] && res['followupLeadList'].length > 0 ){
       // this.displayPopup(res['followupLeadList']);
       }
    }, err=> {
      console.log(err);
    })
  }
  displayPopup(popupList){
    const activeModal = this.modalService.open(FollowUpModalComponent, {
    backdrop: 'static',
    size: 'lg',
    });
    activeModal.componentInstance.BUTTONS.OK = 'OK';
    activeModal.componentInstance.modalData = popupList;
    activeModal.componentInstance.modalHeader = 'Warning!';
    activeModal.componentInstance.modalContent = `Below leads are in follow up list. Please take action asap!`;

  }

}
