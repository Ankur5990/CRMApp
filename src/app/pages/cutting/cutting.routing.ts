import { RouterModule, Routes } from "@angular/router";
import { CuttingComponent } from './cutting.component';
import { CreateCuttingComponent } from './create-cutting/create-cutting.component';
import { CuttingListComponent } from './cutting-list/cutting-list.component';

const route: Routes = [
    {
        path: '',
        component: CuttingComponent,
        children: [
            {
              path: 'create',
              component: CreateCuttingComponent,
            },
            {
              path: 'list',
              component: CuttingListComponent,
            },
            {
              path: 'edit/:cuttingId',
              component: CreateCuttingComponent,
              data: {editMode: true},
            },
            {
              path: 'view/:cuttingId',
              component: CreateCuttingComponent,
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
export const CuttingRouting = RouterModule.forChild(route);