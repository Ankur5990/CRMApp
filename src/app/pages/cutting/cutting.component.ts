import { Component } from '@angular/core';
import { UserService } from '../../shared/user.service';
import { CuttingService } from './cutting.service';

@Component({
    selector: '',
    template: `<router-outlet></router-outlet>`
})

export class CuttingComponent {
    constructor(private cuttingService: CuttingService, private userService: UserService) { 
        const now = new Date();
        let cuttingListTask = this.cuttingService.getCuttingObject();
        let createCuttingTask = this.cuttingService.getCuttingObject();
        cuttingListTask.startDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        cuttingListTask.endDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };

        createCuttingTask.startDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        createCuttingTask.endDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    }
	
}