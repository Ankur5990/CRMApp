import { RouterModule, Routes } from "@angular/router";
import { StockComponent } from './stock.component';
import { CreateStockComponent } from './create-stock/create-stock.component';
import { StockListComponent } from './stock-list/stock-list.component';

const route: Routes = [
    {
        path: '',
        component: StockComponent,
        children: [
            {
              path: 'create',
              component: CreateStockComponent,
            },
            {
              path: 'list',
              component: StockListComponent,
            },
            {
              path: 'edit/:stockId',
              component: CreateStockComponent,
              data: {editMode: true},
            },
            {
              path: 'view/:stockId',
              component: CreateStockComponent,
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
export const StockRouting = RouterModule.forChild(route);