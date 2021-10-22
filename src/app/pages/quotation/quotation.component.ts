import { Component } from '@angular/core';
import { UserService } from '../../shared/user.service';
import { QuotationService } from './quotation.service';

@Component({
    selector: '',
    template: `<router-outlet></router-outlet>`
})

export class QuotationComponent {
    constructor(private quotationService: QuotationService, private userService: UserService) { 
        const now = new Date();
        let quotationListTask = this.quotationService.getQuotationObject();
        let createQuotation = this.quotationService.getQuotationObject();
        quotationListTask.startDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        quotationListTask.endDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        quotationListTask.QuotationType = '';
        createQuotation.Remarks = '';
    }
	
}