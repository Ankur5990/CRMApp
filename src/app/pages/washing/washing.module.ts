import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { WashingRouting } from './washing.routing';
import { SharedModule } from '../../shared/shared.module';
import { NgaModule } from '../../theme/nga.module';
import { GenericSort } from '../../shared/pipes/generic-sort.pipe';
import { WashingComponent } from './washing.component';
import { CreateWashingComponent } from './create-washing/create-washing.component';
import { WashingService } from './washing.service';
import { WashingListComponent } from './washing-list/washing-list.component';

@NgModule({
  imports: [
    CommonModule,
    WashingRouting,
    FormsModule,
    SharedModule,
    NgbModule,
    NgaModule
  ],
  declarations: [ WashingListComponent, CreateWashingComponent, WashingComponent],
  providers: [ WashingService, GenericSort]
})
export class WashingModule { }
