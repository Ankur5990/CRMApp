import { RouterModule, Routes } from "@angular/router";
import { ProductComponent } from "./product.component";
import { CreateProductComponent } from "./create-product/create-product.component";
import { ProductListComponent } from "./product-list/product-list.component";

const route: Routes = [
    {
        path: '',
        component: ProductComponent,
        children: [
            {
              path: 'create',
              component: CreateProductComponent,
            },
            {
              path: 'list',
              component: ProductListComponent,
            },
            {
              path: 'edit/:productId',
              component: CreateProductComponent,
              data: {editMode: true},
            },
            {
              path: 'view/:productId',
              component: CreateProductComponent,
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
export const ProductRouting = RouterModule.forChild(route);