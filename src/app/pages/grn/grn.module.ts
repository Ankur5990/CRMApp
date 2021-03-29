import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { SharedModule } from '../../shared/shared.module';
import { NgaModule } from '../../theme/nga.module';
import { GenericSort } from '../../shared/pipes/generic-sort.pipe';
import { GRNService } from './grn.service';
import { GRNComponent } from './grn.component';
import { GRNListComponent } from './grn-list/grn-list.component';
import { CreateGRNComponent } from './create-grn/create-grn.component';
import { GrnsRouting } from './grn.routing';

@NgModule({
  imports: [
    CommonModule,
    GrnsRouting,
    FormsModule,
    SharedModule,
    NgbModule,
    NgaModule
  ],
  declarations: [CreateGRNComponent, GRNListComponent, GRNComponent],
  providers: [GRNService, GenericSort]
})
export class GRNModule { }
