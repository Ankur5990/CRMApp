import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { SharedModule } from '../../shared/shared.module';
import { NgaModule } from '../../theme/nga.module';
import { GenericSort } from '../../shared/pipes/generic-sort.pipe';
import { ReturnRouting } from './return.routing';
import { CreateReturnComponent } from './create-return/create-return.component';
import { ReturnListComponent } from './return-list/return-list.component';
import { ReturnComponent } from './return.component';
import { ReturnService } from './return.service';

@NgModule({
  imports: [
    CommonModule,
    ReturnRouting,
    FormsModule,
    SharedModule,
    NgbModule,
    NgaModule
  ],
  declarations: [CreateReturnComponent, ReturnListComponent, ReturnComponent],
  providers: [ReturnService, GenericSort]
})
export class ReturnModule { }
