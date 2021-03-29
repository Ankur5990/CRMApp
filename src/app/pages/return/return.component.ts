import { Component } from '@angular/core';
import { ReturnService } from './return.service';

@Component({
    selector: 'app-return',
    template: `<router-outlet></router-outlet>`
})

export class ReturnComponent {
    constructor(private returnService: ReturnService) { 
        const now = new Date();
        let returnListTask = this.returnService.getReturnObject();
        let createReturnTask = this.returnService.getReturnObject();
        returnListTask.startDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        returnListTask.endDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        createReturnTask.ReturnType = 0;
    }
	
}