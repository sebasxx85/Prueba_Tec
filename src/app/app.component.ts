import { Component } from '@angular/core';
import { ProductDashboardComponent } from './Components/product-dashboard/product-dashboard.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProductDashboardComponent],
  template: `<app-product-dashboard></app-product-dashboard>`
})
export class AppComponent {}
