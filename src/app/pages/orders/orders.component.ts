import { Component } from '@angular/core';
import { UserService } from '../../shared/user.service';
import { OrderService } from './orders.service';

@Component({
    selector: '',
    template: `<router-outlet></router-outlet>`
})

export class OrdersComponent {
    constructor(private leadService: OrderService, private userService: UserService) { 
        const now = new Date();
        let orderListTask = this.leadService.getOrdersObject();
        let createOrderTask = this.leadService.getOrdersObject();
        orderListTask.startDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        orderListTask.endDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        orderListTask.OrderType = '';
        orderListTask.Status = '';
        createOrderTask.Status = '';
    }
	
}