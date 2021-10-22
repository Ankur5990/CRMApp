import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { SharedModule } from '../../shared/shared.module';
import { NgaModule } from '../../theme/nga.module';
import { GenericSort } from '../../shared/pipes/generic-sort.pipe';
import { QuotationsRouting } from './quotation.routing';
import { QuotationListComponent } from './quotation-list/quotation-list.component';
import { CreateQuotationComponent } from './create-quotation/create-quotation.component';
import { QuotationComponent } from './quotation.component';
import { QuotationService } from './quotation.service';

@NgModule({
  imports: [
    CommonModule,
    QuotationsRouting,
    FormsModule,
    SharedModule,
    NgbModule,
    NgaModule
  ],
  declarations: [QuotationListComponent, CreateQuotationComponent,QuotationComponent],
  providers: [QuotationService, GenericSort]
})
export class QuotationModule { }
