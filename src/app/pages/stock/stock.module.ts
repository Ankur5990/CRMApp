import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { StockRouting } from './stock.routing';
import { SharedModule } from '../../shared/shared.module';
import { NgaModule } from '../../theme/nga.module';
import { StockService } from './stock.service';
import { StockComponent } from './stock.component';
import { StockListComponent } from './stock-list/stock-list.component';
import { CreateStockComponent } from './create-stock/create-stock.component';

@NgModule({
  imports: [
    CommonModule,
    StockRouting,
    FormsModule,
    SharedModule,
    NgbModule,
    NgaModule
  ],
  declarations: [StockListComponent, CreateStockComponent,StockComponent],
  providers: [StockService]
})
export class StockModule { }
