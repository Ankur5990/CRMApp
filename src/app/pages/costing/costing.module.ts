import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { CostingRouting } from './costing.routing';
import { SharedModule } from '../../shared/shared.module';
import { NgaModule } from '../../theme/nga.module';
import { GenericSort } from '../../shared/pipes/generic-sort.pipe';
import { CostingService } from './costing.service';
import { CreateCostingComponent } from './create-costing/create-costing.component';
import { CostingListComponent } from './costing-list/costing-list.component';
import { CostingComponent } from './costing.component';

@NgModule({
  imports: [
    CommonModule,
    CostingRouting,
    FormsModule,
    SharedModule,
    NgbModule,
    NgaModule
  ],
  declarations: [CostingListComponent, CreateCostingComponent,CostingComponent],
  providers: [CostingService, GenericSort]
})
export class CostingModule { }
