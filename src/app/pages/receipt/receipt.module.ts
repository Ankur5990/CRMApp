import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { SharedModule } from '../../shared/shared.module';
import { NgaModule } from '../../theme/nga.module';
import { GenericSort } from '../../shared/pipes/generic-sort.pipe';
import { ReceiptService } from './receipt.service';
import { ReceiptListComponent } from './receipt-list/receipt-list.component';
import { CreateReceiptComponent } from './create-receipt/create-receipt.component';
import { ReceiptComponent } from './receipt.component';
import { ReceiptRouting } from './receipt.routing';

@NgModule({
  imports: [
    CommonModule,
    ReceiptRouting,
    FormsModule,
    SharedModule,
    NgbModule,
    NgaModule
  ],
  declarations: [ ReceiptListComponent, CreateReceiptComponent, ReceiptComponent],
  providers: [ ReceiptService, GenericSort]
})
export class ReceiptModule { }
