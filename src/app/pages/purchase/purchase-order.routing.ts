import { RouterModule, Routes } from "@angular/router";
import { PurchaseOrderComponent } from './purchase-order.component';
import { CreatePurchaseOrderComponent } from './create-purchase-order/create-purchase-order.component';
import { PurchaseOrderListComponent } from './purchase-order-list/purchase-order-list.component';

const route: Routes = [
    {
        path: '',
        component: PurchaseOrderComponent,
        children: [
            {
              path: 'create',
              component: CreatePurchaseOrderComponent,
            },
            {
              path: 'list',
              component: PurchaseOrderListComponent,
            },
            {
              path: 'edit/:purchaseId',
              component: CreatePurchaseOrderComponent,
              data: {editMode: true},
            },
            {
              path: 'view/:purchaseId',
              component: CreatePurchaseOrderComponent,
              data: {viewMode: true},
            },
            {
                path: '',
                redirectTo: 'list',
                pathMatch: 'full'
            }
        ]
    }
];
export const PurchaseRouting = RouterModule.forChild(route);