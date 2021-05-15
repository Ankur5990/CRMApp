import { Component } from '@angular/core';
import { UserService } from '../../shared/user.service';
import { ProductService } from './product.service';

@Component({
    selector: 'app-product',
    template: `<router-outlet></router-outlet>`
})

export class ProductComponent {
    constructor(private productService: ProductService, private userService: UserService) { 
        const now = new Date();
        let productListTask = this.productService.getProductObject();
        let createProductTask = this.productService.getProductObject();
        productListTask.startDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        productListTask.endDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };

        createProductTask.startDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        createProductTask.endDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    }
	
}