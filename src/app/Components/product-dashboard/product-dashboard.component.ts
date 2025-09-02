import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import { switchMap, map, startWith, catchError } from 'rxjs/operators';
import { Product } from '../../Models/product.model';
import { ProductService } from '../../Services/product.service';

type Vm = { products: Product[]; loading: boolean; error?: any };

@Component({
  selector: 'app-product-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-dashboard.component.html',
  styleUrls: ['./product-dashboard.component.scss']
})
export class ProductDashboardComponent {
  private fb = inject(FormBuilder);
  private api = inject(ProductService);

  showModal = false;

  private reload$ = new BehaviorSubject<void>(undefined);

  vm$ = this.reload$.pipe(
    switchMap(() =>
      this.api.getProducts().pipe(
        map(products => ({ products, loading: false } as Vm)),
        startWith({ products: [], loading: true } as Vm),
        catchError(error => of({ products: [], loading: false, error } as Vm))
      )
    )
  );

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    stock: [0, [Validators.required, Validators.min(0)]],
  });

  openModal() { this.showModal = true; }
  closeModal() { this.showModal = false; this.form.reset({ price: 0, stock: 0 }); }

  submit() {
    if (this.form.invalid) return;
    const dto = this.form.getRawValue() as Product;
    this.api.addProduct(dto).subscribe({
      next: () => { this.closeModal(); this.reload$.next(); },
      error: e => { console.error('Error al agregar:', e); alert('No se pudo agregar'); }
    });
  }

  remove(p: Product) {
    if (!p.id) return;
    if (!confirm(`¿Eliminar "${p.name}"?`)) return;
    this.api.deleteProduct(p.id).subscribe({
      next: () => this.reload$.next(),
      error: e => { console.error('Error al eliminar:', e); alert('No se pudo eliminar'); }
    });
  }

  trackById = (_: number, item: Product) => item.id!;
  get f() { return this.form.controls; }
}
