import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { CuttingRouting } from './cutting.routing';
import { SharedModule } from '../../shared/shared.module';
import { NgaModule } from '../../theme/nga.module';
import { GenericSort } from '../../shared/pipes/generic-sort.pipe';
import { CuttingComponent } from './cutting.component';
import { CreateCuttingComponent } from './create-cutting/create-cutting.component';
import { CuttingService } from './cutting.service';
import { CuttingListComponent } from './cutting-list/cutting-list.component';

@NgModule({
  imports: [
    CommonModule,
    CuttingRouting,
    FormsModule,
    SharedModule,
    NgbModule,
    NgaModule
  ],
  declarations: [CuttingListComponent, CreateCuttingComponent,CuttingComponent],
  providers: [CuttingService, GenericSort]
})
export class CuttingModule { }
