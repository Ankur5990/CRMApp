import { Routes, RouterModule } from "@angular/router";
import { DashboardComponent } from './dashboard.component';

const route: Routes = [
    {
        path: '',
        component: DashboardComponent
    }
];

export const DashboardRouting = RouterModule.forChild(route);