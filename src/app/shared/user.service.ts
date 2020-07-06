
import {map} from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { UserDetails } from './user.interface';
import { HttpService } from './http.service';
import { EncrDecrService } from './encr-decr.service';
import { environment } from '../../environments/environment';

@Injectable()
export class UserService {
    userDetails: UserDetails;

    constructor(private http: HttpService,private EncrDecr: EncrDecrService) { }
    privateKeys: any;


    getUser(): any {
        if (!localStorage.getItem('user')) { return {}; }
        return JSON.parse(localStorage.getItem('user'));
    }

    setUser(user: any) {
        localStorage.setItem('user', JSON.stringify(user));
    }

    getUserDetails(id: string): Observable<UserDetails> {
        return this.http.get(`api/user?UserId=${id}`).pipe(map((user) => {
            this.setUser(user);
            this.userDetails = user;
            return user;
        }));
    }
    isUserExist(email) {
        return this.http.get(`api/user/IsUserExist?email=${email}`).pipe(map((res) => {
            return res;
        }));
    }
    setPrivateKeys(values) {        
        values = values || '';
		// var ciphertext = this.EncrDecr.set(environment.encStr, JSON.stringify(values));
        //localStorage.setItem('privateKeys', ciphertext);
    }

    getPrivateKeys(): any {
		var ciphertext = localStorage.getItem('privateKeys');
		//var bytes = this.EncrDecr.get(environment.encStr, ciphertext);
       // return JSON.parse(bytes);
       return;
    }

    getUserForAutoLogin() {
        let user = localStorage.getItem('auto_login_user');
        if (user) {
            user = JSON.parse(user);
        }
        return user;
    }
}
