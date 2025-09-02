import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { environment as environmentProd } from '../environment/environment';
import { Product } from '../Models/product.model';

type ProductsRes = {
  products: Array<{ id: number; title: string; price: number; stock: number }>;
};

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly base = environmentProd.apiUrl; 

  constructor(private http: HttpClient) {}


  private handleError(error: HttpErrorResponse) {
    console.error('Se produjo un error:', error);
    return throwError(() => new Error(
      error.error?.message ??
      `Error HTTP ${error.status} - ${error.statusText || 'Desconocido'}`
    ));
  }

  /* Listar productos */
  getProducts(): Observable<Product[]> {
    return this.http
      .get<ProductsRes>(`${this.base}/products?select=title,price,stock`)
      .pipe(
        map(res =>
          res.products.map(p => ({
            id: p.id,
            name: p.title,
            price: p.price,
            stock: p.stock
          }))
        ),
        catchError(err => this.handleError(err))
      );
  }

  /** Obtener un producto por id */
  getProduct(id: number): Observable<Product> {
    return this.http.get<any>(`${this.base}/products/${id}`).pipe(
      map(p => ({
        id: p.id,
        name: p.title,
        price: p.price,
        stock: p.stock
      })),
      catchError(error => {
        console.error('Se produjo un error:', error);
        return throwError(() =>
          new Error(error.error?.message ?? 'Error al obtener el producto')
        );
      })
    );
  }

  /* Añadir producto (SIMULADO por DummyJSON)*/
  addProduct(product: Product): Observable<Product> {
    return this.http
      .post<any>(`${this.base}/products/add`, {
        title: product.name,
        price: product.price,
        stock: product.stock ?? 0
      })
      .pipe(
        map(p => ({
          id: p.id,
          name: p.title ?? product.name,
          price: p.price ?? product.price,
          stock: p.stock ?? product.stock ?? 0
        })),
        catchError(err => this.handleError(err))
      );
  }

  /* Borrado (SIMULADO por DummyJSON) */
  deleteProduct(id: number): Observable<void> {
    return this.http.delete(`${this.base}/products/${id}`).pipe(
      map(() => void 0),
      catchError(err => this.handleError(err))
    );
  }
}
