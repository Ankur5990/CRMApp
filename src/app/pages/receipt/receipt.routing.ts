import { RouterModule, Routes } from "@angular/router";
import { ReceiptComponent } from "./receipt.component";
import { CreateReceiptComponent } from "./create-receipt/create-receipt.component";
import { ReceiptListComponent } from "./receipt-list/receipt-list.component";

const route: Routes = [
    {
        path: '',
        component: ReceiptComponent,
        children: [
            {
              path: 'create',
              component: CreateReceiptComponent,
            },
            {
              path: 'list',
              component: ReceiptListComponent,
            },
            {
              path: 'edit/:receiptId',
              component: CreateReceiptComponent,
              data: {editMode: true},
            },
            {
              path: 'view/:receiptId',
              component: CreateReceiptComponent,
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
export const ReceiptRouting = RouterModule.forChild(route);