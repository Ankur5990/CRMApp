import { RouterModule, Routes } from "@angular/router";
import { GRNComponent } from "./grn.component";
import { CreateGRNComponent } from "./create-grn/create-grn.component";
import { GRNListComponent } from "./grn-list/grn-list.component";

const route: Routes = [
    {
        path: '',
        component: GRNComponent,
        children: [
            {
              path: 'create',
              component: CreateGRNComponent,
            },
            {
              path: 'list',
              component: GRNListComponent,
            },
            {
              path: 'edit/:grnId',
              component: CreateGRNComponent,
              data: {editMode: true},
            },
            {
              path: 'view/:grnId',
              component: CreateGRNComponent,
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
export const GrnsRouting = RouterModule.forChild(route);