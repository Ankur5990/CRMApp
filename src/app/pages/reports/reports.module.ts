import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { SharedModule } from '../../shared/shared.module';
import { NgaModule } from '../../theme/nga.module';
import { ReportsComponent } from './reports.component';
import { ReportsService } from './reports.service';
import { ReportRouting } from './reports.routing';

@NgModule({
  imports: [
    CommonModule,
    ReportRouting,
    FormsModule,
    SharedModule,
    NgbModule,
    NgaModule
  ],
  declarations: [ReportsComponent],
  providers: [ReportsService]
})
export class ReportsModule { }
