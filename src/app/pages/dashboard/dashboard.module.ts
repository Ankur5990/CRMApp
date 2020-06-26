import { NgModule } from "@angular/core";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { DashboardComponent } from './dashboard.component';
import { DashboardRouting } from './dashboard.routing';
import { DashboardService } from './dashboard.service';

@NgModule({
    declarations: [DashboardComponent],
    imports: [
        CommonModule,
        DashboardRouting,
        FormsModule,
        SharedModule,
    ],
    exports: [],
    providers: [DashboardService]
})

export class DashboardModule {

}