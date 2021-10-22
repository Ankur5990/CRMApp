import { RouterModule, Routes } from "@angular/router";
import { QuotationComponent } from "./quotation.component";
import { CreateQuotationComponent } from "./create-quotation/create-quotation.component";
import { QuotationListComponent } from "./quotation-list/quotation-list.component";

const route: Routes = [
    {
        path: '',
        component: QuotationComponent,
        children: [
            {
              path: 'create',
              component: CreateQuotationComponent,
            },
            {
              path: 'list',
              component: QuotationListComponent,
            },
            {
              path: 'edit/:quotationId',
              component: CreateQuotationComponent,
              data: {editMode: true},
            },
            {
              path: 'view/:quotationId',
              component: CreateQuotationComponent,
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
export const QuotationsRouting = RouterModule.forChild(route);