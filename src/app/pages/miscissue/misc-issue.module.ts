import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { IssueRouting } from './misc-issue.routing';
import { SharedModule } from '../../shared/shared.module';
import { NgaModule } from '../../theme/nga.module';
import { GenericSort } from '../../shared/pipes/generic-sort.pipe';
import { MiscIssueComponent } from './misc-issue.component';
import { MiscIssueService } from './misc-issue.service';
import { MiscIssueListComponent } from './misc-issue-list/misc-issue-list.component';
import { CreateMiscIssueComponent } from './create-misc-issue/create-misc-issue.component';

@NgModule({
  imports: [
    CommonModule,
    IssueRouting,
    FormsModule,
    SharedModule,
    NgbModule,
    NgaModule
  ],
  declarations: [MiscIssueListComponent, CreateMiscIssueComponent,MiscIssueComponent],
  providers: [MiscIssueService, GenericSort]
})
export class MiscIssueModule { }
