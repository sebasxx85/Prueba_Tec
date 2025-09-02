import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../environment/environment';
import { Product } from '../Models/product.model';

type ProductsRes = {
  products: Array<{ id: number; title: string; price: number; stock: number }>;
};

const LS_KEY = 'productsCache';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ---- helpers de cache ----
  private readCache(): Product[] {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as Product[]) : [];
    } catch {
      return [];
    }
  }

  private writeCache(list: Product[]): void {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Se produjo un error:', error);
    return throwError(() => new Error(
      error.error?.message ??
      `Error HTTP ${error.status} - ${error.statusText || 'Desconocido'}`
    ));
  }

  /** Carga API y guarda en cache */
  getProducts(): Observable<Product[]> {
    const cached = this.readCache();
    if (cached.length) {
      return of(cached);
    }

    return this.http
      .get<ProductsRes>(`${this.base}/products?select=title,price,stock`)
      .pipe(
        map(res =>
          res.products.map(p => ({
            id: p.id, name: p.title, price: p.price, stock: p.stock
          }))
        ),
        tap(list => this.writeCache(list)),
        catchError(err => this.handleError(err))
      );
  }

  /* Obtener */
  getProduct(id: number): Observable<Product> {
    const found = this.readCache().find(p => p.id === id);
    if (found) return of(found);

    return this.http.get<any>(`${this.base}/products/${id}`).pipe(
      map(p => ({ id: p.id, name: p.title, price: p.price, stock: p.stock })),
      catchError(err => this.handleError(err))
    );
  }

  /** Añadir en localStorage */
  addProduct(prod: Product): Observable<Product> {
  return this.http.post<any>(`${this.base}/products/add`, {
    title: prod.name, price: prod.price, stock: prod.stock ?? 0
  })
  .pipe(
    map(p => ({
      id: p.id,
      name: p.title ?? prod.name,
      price: p.price ?? prod.price,
      stock: p.stock ?? prod.stock ?? 0
    }) as Product),
    tap(created => {
      const list = this.readCache().filter(x => x.id !== created.id);
      this.writeCache([created, ...list]);   
    }),
    catchError(err => this.handleError(err))
  );
}

  /** Borrado en localStorage */
  deleteProduct(id: number): Observable<void> {
    return this.http.delete(`${this.base}/products/${id}`).pipe(
      map(() => void 0),
      tap(() => {
        const list = this.readCache().filter(p => p.id !== id);
        this.writeCache(list);
      }),
      catchError(err => this.handleError(err))
    );
  }

  /* Recarga cache */
  refreshFromApi(): Observable<Product[]> {
    localStorage.removeItem(LS_KEY);
    return this.getProducts();
  }
}
