import { Component, OnInit } from '@angular/core';
import { Router} from '@angular/router';
import { FormGroup, AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { NotificationsService } from 'angular2-notifications';
import { LoginService } from './login.service';

@Component({
  selector: 'login',
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})

export class Login implements OnInit {
	loginForm: FormGroup;
	fpForm: FormGroup;
	username: AbstractControl;
	password: AbstractControl;
	forgotEmail: AbstractControl;
	forgotUsername: AbstractControl;
	autologincheck: AbstractControl;
	submitted: boolean = false;
	isLoginMode: boolean = true;
	isProcessing: boolean = false;
	prodLabel: string = '';
	signOutFlag: boolean;
	passExpirationDate;

  	constructor (
    	private fb: FormBuilder,
    	private loginService: LoginService,
    	private router: Router,
    	private notification: NotificationsService) {
  	}

	ngOnInit() {
		this.loginForm = this.fb.group({
		'username': ['', Validators.compose([Validators.required, Validators.minLength(2)])],
		'password': ['', Validators.compose([Validators.required, Validators.minLength(4)])],
		});
		this.username = this.loginForm.controls['username'];
		this.password = this.loginForm.controls['password'];
	}

	 onSubmit(values: Object): void {
		const user = {
			"UserName":values['username'],
			"Password": values['password']
			};
		this.isProcessing = true;
		this.loginService.login(user).subscribe((res) => {
			this.isProcessing = false;
			if(res.Error[0].ERROR == 0) {
				localStorage.setItem('UserLoginId', res.LoginInfo[0].USERLOGINID);
				localStorage.setItem('UserRole', res.LoginInfo[0].USERROLE);
				localStorage.setItem('UserName', res.LoginInfo[0].USERNAME);
				this.router.navigate(['pages']);
			} else {
				this.notification.error('Error',res.Error[0].Msg);
			}
		}, (error) => {
			this.isProcessing = false;
			this.notification.error('Error','Something went wrong while Login !!!');
		});
	}
}
