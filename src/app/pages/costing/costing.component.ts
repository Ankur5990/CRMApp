import { Component } from '@angular/core';
import { UserService } from '../../shared/user.service';
import { CostingService } from './costing.service';

@Component({
    selector: '',
    template: `<router-outlet></router-outlet>`
})

export class CostingComponent {
    constructor(private costingService: CostingService, private userService: UserService) { 
        const now = new Date();
        let costingListTask = this.costingService.getCostingObject();
        let createCostingTask = this.costingService.getCostingObject();
        costingListTask.startDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        costingListTask.endDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        costingListTask.CustomerName = '';
        costingListTask.Status = '';

        createCostingTask.startDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        createCostingTask.endDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        createCostingTask.CustomerName = '';
        createCostingTask.Status = '';
    }
	
}