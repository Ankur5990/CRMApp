import { Component } from '@angular/core';
import { UserService } from '../../shared/user.service';
import { ReceiptService } from './receipt.service';

@Component({
    selector: '',
    template: `<router-outlet></router-outlet>`
})

export class ReceiptComponent {
    constructor(private receiptService: ReceiptService, private userService: UserService) { 
        const now = new Date();
        let receiptListTask = this.receiptService.getReceiptObject();
        let createReceiptTask = this.receiptService.getReceiptObject();
        receiptListTask.startDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        receiptListTask.endDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };

        createReceiptTask.startDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        createReceiptTask.endDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    }
	
}
