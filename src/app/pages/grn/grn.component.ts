import { Component } from '@angular/core';
import { UserService } from '../../shared/user.service';
import { GRNService } from './grn.service';

@Component({
    selector: 'app-grn',
    template: `<router-outlet></router-outlet>`
})

export class GRNComponent {
    constructor(private grnService: GRNService) { 
        const now = new Date();
        let grnListTask = this.grnService.getGrnObject();
        let createGrnTask = this.grnService.getGrnObject();
        grnListTask.startDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        grnListTask.endDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        createGrnTask.VendorID = 0;
    }
	
}