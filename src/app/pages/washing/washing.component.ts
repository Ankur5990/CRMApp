import { Component } from '@angular/core';
import { UserService } from '../../shared/user.service';
import { WashingService } from './washing.service';

@Component({
    selector: '',
    template: `<router-outlet></router-outlet>`
})

export class WashingComponent {
    constructor(private washingService: WashingService, private userService: UserService) { 
        const now = new Date();
        let washingListTask = this.washingService.getWashingObject();
        let createWashingTask = this.washingService.getWashingObject();
        washingListTask.startDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        washingListTask.endDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };

        createWashingTask.startDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        createWashingTask.endDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    }
	
}