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

  // mínimos: price >= 1, stock >= 1
  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    price: [1, [Validators.required, Validators.min(1)]],
    stock: [1, [Validators.required, Validators.min(1)]],
  });

  openModal() { this.showModal = true; }
  closeModal() { this.showModal = false; this.form.reset({ price: 1, stock: 1 }); }

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

  hardRefresh() {
    this.api.refreshFromApi().subscribe({
      next: () => this.reload$.next(),
      error: e => console.error(e)
    });
  }

  // Entradas numéricas
  blockBadKeys(ev: KeyboardEvent) {
    if (['e', 'E', '+', '-'].includes(ev.key)) ev.preventDefault();
  }

  enforceBounds(
    ctrlName: string,
    opts: { min?: number; max?: number; emptyValue?: number; negativeValue?: number; integer?: boolean } = {}
  ): void {
    const c = this.form.get(ctrlName);
    if (!c) return;

    const raw = c.value as any;
    if (raw === '' || raw === null || raw === undefined) {
      if (opts.emptyValue !== undefined) c.setValue(opts.emptyValue, { emitEvent: false });
      return;
    }

    let n = Number(raw);
    if (!Number.isFinite(n)) return;

    if (n < 0) n = opts.negativeValue ?? (opts.min ?? 1);
    if (opts.min !== undefined && n < opts.min) n = opts.min;
    if (opts.max !== undefined && n > opts.max) n = opts.max;
    if (opts.integer) n = Math.floor(n);

    c.setValue(n, { emitEvent: false });
  }


  fixMinInt(ctrlName: string, min = 1): void {
    this.enforceBounds(ctrlName, { min, emptyValue: min, negativeValue: min, integer: true });
  }

  trackById = (_: number, item: Product) => item.id!;
  get f() { return this.form.controls; }
}
