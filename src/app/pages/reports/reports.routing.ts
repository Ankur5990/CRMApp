import { RouterModule, Routes } from "@angular/router";
import { ReportsComponent } from "./reports.component";

const route: Routes = [
    {
        path: '',
        component: ReportsComponent,
    }
];
export const ReportRouting = RouterModule.forChild(route);
