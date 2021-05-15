import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { SharedModule } from '../../shared/shared.module';
import { NgaModule } from '../../theme/nga.module';
import { GenericSort } from '../../shared/pipes/generic-sort.pipe';
import { ProductRouting } from './product.routing';
import { ProductListComponent } from './product-list/product-list.component';
import { CreateProductComponent } from './create-product/create-product.component';
import { ProductComponent } from './product.component';
import { ProductService } from './product.service';

@NgModule({
  imports: [
    CommonModule,
    ProductRouting,
    FormsModule,
    SharedModule,
    NgbModule,
    NgaModule
  ],
  declarations: [ ProductListComponent, CreateProductComponent, ProductComponent],
  providers: [ ProductService, GenericSort]
})
export class ProductModule { }
