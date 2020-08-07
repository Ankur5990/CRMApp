import { Component } from '@angular/core';
import { UserService } from '../../shared/user.service';
import { StockService } from './stock.service';

@Component({
    selector: '',
    template: `<router-outlet></router-outlet>`
})

export class StockComponent {
    constructor(private stockService: StockService, private userService: UserService) { 
        const now = new Date();
        let stockListTask = this.stockService.getOrdersObject();
        let createStockTask = this.stockService.getOrdersObject();
        stockListTask.startDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        stockListTask.endDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        stockListTask.OrderType = '';
        stockListTask.Status = '';
        createStockTask.Status = '';
    }
	
}