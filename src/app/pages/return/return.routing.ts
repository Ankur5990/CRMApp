import { RouterModule, Routes } from "@angular/router";
import { ReturnComponent } from "./return.component";
import { CreateReturnComponent } from "./create-return/create-return.component";
import { ReturnListComponent } from "./return-list/return-list.component";

const route: Routes = [
    {
        path: '',
        component: ReturnComponent,
        children: [
            {
              path: 'create',
              component: CreateReturnComponent,
            },
            {
              path: 'list',
              component: ReturnListComponent,
            },
            {
              path: 'edit/:returnId',
              component: CreateReturnComponent,
              data: {editMode: true},
            },
            {
              path: 'view/:returnId',
              component: CreateReturnComponent,
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
export const ReturnRouting = RouterModule.forChild(route);