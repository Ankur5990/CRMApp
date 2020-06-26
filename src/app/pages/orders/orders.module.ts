import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { OrdersRouting } from './orders.routing';
import { SharedModule } from '../../shared/shared.module';
import { NgaModule } from '../../theme/nga.module';
import { GenericSort } from '../../shared/pipes/generic-sort.pipe';
import { OrdersComponent } from './orders.component';
import { OrderService } from './orders.service';
import { OrdersListComponent } from './orders-list/orders-list.component';
import { CreateOrderComponent } from './create-order/create-order.component';

@NgModule({
  imports: [
    CommonModule,
    OrdersRouting,
    FormsModule,
    SharedModule,
    NgbModule,
    NgaModule
  ],
  declarations: [OrdersListComponent, CreateOrderComponent,OrdersComponent],
  providers: [OrderService, GenericSort]
})
export class OrdersModule { }
