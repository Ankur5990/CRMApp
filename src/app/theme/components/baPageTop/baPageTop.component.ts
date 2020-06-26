import {Component, Input,OnInit} from '@angular/core';

import {GlobalState} from '../../../global.state';

import { UserService } from '../../../shared/user.service';
import { SignoutService } from '../../../shared/signout.service';

@Component({
  selector: 'ba-page-top',
  templateUrl: './baPageTop.html',
  styleUrls: ['./baPageTop.scss']
})
export class BaPageTop implements OnInit {
  @Input() userDetails:any;
  
  public isScrolled:boolean = false;
  public isMenuCollapsed:boolean = false;
  public logedInUser:any={};
  public showReset:boolean=false;
  public Name = '';
  
  ngOnInit() {
    this.Name = localStorage.getItem('UserName');
  }

  constructor(private _state:GlobalState, private userService: UserService,
      private singOutService: SignoutService) {
    this._state.subscribe('menu.isCollapsed', (isCollapsed) => {
      this.isMenuCollapsed = isCollapsed;
    });
    this.logedInUser = this.userService.getUser();
  
       this.showReset = this.logedInUser.IsRIInternal;
  }

  public toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed;
    this._state.notifyDataChanged('menu.isCollapsed', this.isMenuCollapsed);
    return false;
  }

  public scrolledChanged(isScrolled) {
    this.isScrolled = isScrolled;
  }

  signOut() {
    localStorage.clear();
    this.singOutService.signoutFlag = true;
  }
}
