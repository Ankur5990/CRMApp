import { Component } from '@angular/core';
import { UserService } from '../../shared/user.service';
import { PurchaseOrderService } from './purchase-order.service';

@Component({
    selector: '',
    template: `<router-outlet></router-outlet>`
})

export class PurchaseOrderComponent {
    constructor(private purchaseService: PurchaseOrderService, private userService: UserService) { 
        const now = new Date();
        let purchaseListTask = this.purchaseService.getPurchaseObject();
        let createPurchaseTask = this.purchaseService.getPurchaseObject();
        purchaseListTask.startDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        purchaseListTask.endDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        purchaseListTask.CustomerName = '';
        purchaseListTask.Status = '';

        createPurchaseTask.startDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        createPurchaseTask.endDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        createPurchaseTask.CustomerName = '';
        createPurchaseTask.Status = '';
    }
	
}