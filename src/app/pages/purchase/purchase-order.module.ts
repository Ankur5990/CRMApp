import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { PurchaseRouting } from './purchase-order.routing';
import { SharedModule } from '../../shared/shared.module';
import { NgaModule } from '../../theme/nga.module';
import { GenericSort } from '../../shared/pipes/generic-sort.pipe';
import { PurchaseOrderComponent } from './purchase-order.component';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderListComponent } from './purchase-order-list/purchase-order-list.component';
import { CreatePurchaseOrderComponent } from './create-purchase-order/create-purchase-order.component';

@NgModule({
  imports: [
    CommonModule,
    PurchaseRouting,
    FormsModule,
    SharedModule,
    NgbModule,
    NgaModule
  ],
  declarations: [PurchaseOrderListComponent, CreatePurchaseOrderComponent,PurchaseOrderComponent],
  providers: [PurchaseOrderService, GenericSort]
})
export class PurchaseOrderModule { }
