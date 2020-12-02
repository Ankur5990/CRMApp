import { RouterModule, Routes } from "@angular/router";
import { WashingComponent } from './washing.component';
import { CreateWashingComponent } from './create-washing/create-washing.component';
import { WashingListComponent } from './washing-list/washing-list.component';

const route: Routes = [
    {
        path: '',
        component: WashingComponent,
        children: [
            {
              path: 'create',
              component: CreateWashingComponent,
            },
            {
              path: 'list',
              component: WashingListComponent,
            },
            {
              path: 'edit/:washingId',
              component: CreateWashingComponent,
              data: {editMode: true},
            },
            {
              path: 'view/:washingId',
              component: CreateWashingComponent,
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
export const WashingRouting = RouterModule.forChild(route);