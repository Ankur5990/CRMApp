import { Routes, RouterModule, CanActivate } from '@angular/router';
import { PagesComponent } from './pages.component';
import { ModuleWithProviders } from '@angular/core';
import { AuthGuardService as AuthGuard } from './auth/auth-guard.service';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: 'app/pages/login/login.module#LoginModule',
  },
  {
    path: 'pages',
    component: PagesComponent,
	  canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', loadChildren: './dashboard/dashboard.module#DashboardModule' },
      { path: 'leads', loadChildren: './leads/leads.module#LeadsModule' },
      { path: 'orders', loadChildren: './orders/orders.module#OrdersModule' },
      { path: 'quotation', loadChildren: './quotation/quotation.module#QuotationModule' },
      { path: 'purchase-order', loadChildren: './purchase/purchase-order.module#PurchaseOrderModule' },
      { path: 'cutting', loadChildren: './cutting/cutting.module#CuttingModule' },
      { path: 'washing', loadChildren: './washing/washing.module#WashingModule' },
      { path: 'costing', loadChildren: './costing/costing.module#CostingModule' },
      { path: 'issue', loadChildren: './miscissue/misc-issue.module#MiscIssueModule' },
      { path: 'grn', loadChildren: './grn/grn.module#GRNModule' },
      { path: 'return', loadChildren: './return/return.module#ReturnModule' },
      { path: 'product', loadChildren: './products/product.module#ProductModule' },
      { path: 'report', loadChildren: './reports/reports.module#ReportsModule' },
      { path: 'receipt', loadChildren: './receipt/receipt.module#ReceiptModule' }
    ]
  }
];

export const PagesRouting: ModuleWithProviders = RouterModule.forChild(routes);
