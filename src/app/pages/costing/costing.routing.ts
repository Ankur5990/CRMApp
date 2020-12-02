import { RouterModule, Routes } from "@angular/router";
import { CreateCostingComponent } from './create-costing/create-costing.component';
import { CostingComponent } from './costing.component';
import { CostingListComponent } from './costing-list/costing-list.component';

const route: Routes = [
    {
        path: '',
        component: CostingComponent,
        children: [
            {
              path: 'create',
              component: CreateCostingComponent,
            },
            {
              path: 'list',
              component: CostingListComponent,
            },
            {
              path: 'edit/:costingId',
              component: CreateCostingComponent,
              data: {editMode: true},
            },
            {
              path: 'view/:costingId',
              component: CreateCostingComponent,
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
export const CostingRouting = RouterModule.forChild(route);