import { RouterModule, Routes } from "@angular/router";
import { OrdersComponent } from './orders.component';
import { CreateOrderComponent } from './create-order/create-order.component';
import { OrdersListComponent } from './orders-list/orders-list.component';

const route: Routes = [
    {
        path: '',
        component: OrdersComponent,
        children: [
            {
              path: 'create',
              component: CreateOrderComponent,
            },
            {
              path: 'list',
              component: OrdersListComponent,
            },
            {
              path: 'edit/:orderId',
              component: CreateOrderComponent,
              data: {editMode: true},
            },
            {
              path: 'view/:orderId',
              component: CreateOrderComponent,
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
export const OrdersRouting = RouterModule.forChild(route);