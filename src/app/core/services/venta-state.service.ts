import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { VentaRequest, VentaResponse } from '../models/venta.model';
import { Cliente } from '../models/cliente.model';
import { Producto } from '../models/product.model';
import { Inventario } from '../models/inventario.model';

export interface VentaState {
  // Estado de la venta actual
  ventaActual: VentaRequest | null;
  clienteSeleccionado: Cliente | null;
  carrito: any[];
  
  // Cálculos
  subtotal: number;
  igv: number;
  total: number;
  descuento: number;
  
  // Estados de UI
  activeTabIndex: number;
  pasoActual: number;
  loading: boolean;
  
  // Datos
  ventas: VentaResponse[];
  clientes: Cliente[];
  productos: Producto[];
  inventarios: Inventario[];
}

const initialState: VentaState = {
  ventaActual: null,
  clienteSeleccionado: null,
  carrito: [],
  subtotal: 0,
  igv: 0,
  total: 0,
  descuento: 0,
  activeTabIndex: 0,
  pasoActual: 0,
  loading: false,
  ventas: [],
  clientes: [],
  productos: [],
  inventarios: []
};

@Injectable({
  providedIn: 'root'
})
export class VentaStateService {
  private state$ = new BehaviorSubject<VentaState>(initialState);
  private actions$ = new Subject<{ type: string; payload?: any }>();

  // Observables públicos
  public state$ = this.state$.asObservable();
  public ventaActual$ = this.select(state => state.ventaActual);
  public clienteSeleccionado$ = this.select(state => state.clienteSeleccionado);
  public carrito$ = this.select(state => state.carrito);
  public total$ = this.select(state => state.total);
  public activeTabIndex$ = this.select(state => state.activeTabIndex);
  public loading$ = this.select(state => state.loading);

  constructor() {
    this.setupActions();
  }

  // Selector helper
  private select<T>(selector: (state: VentaState) => T): Observable<T> {
    return new Observable(observer => {
      this.state$.subscribe(state => {
        observer.next(selector(state));
      });
    });
  }

  private setupActions() {
    this.actions$.subscribe(action => {
      const currentState = this.state$.value;
      
      switch (action.type) {
        case 'SET_CLIENTE':
          this.state$.next({
            ...currentState,
            clienteSeleccionado: action.payload
          });
          break;
          
        case 'ADD_TO_CART':
          const newCarrito = [...currentState.carrito, action.payload];
          this.state$.next({
            ...currentState,
            carrito: newCarrito
          });
          this.calcularTotales();
          break;
          
        case 'REMOVE_FROM_CART':
          const filteredCarrito = currentState.carrito.filter(
            item => item.id !== action.payload
          );
          this.state$.next({
            ...currentState,
            carrito: filteredCarrito
          });
          this.calcularTotales();
          break;
          
        case 'SET_ACTIVE_TAB':
          this.state$.next({
            ...currentState,
            activeTabIndex: action.payload
          });
          break;
          
        case 'SET_LOADING':
          this.state$.next({
            ...currentState,
            loading: action.payload
          });
          break;
          
        case 'SET_VENTAS':
          this.state$.next({
            ...currentState,
            ventas: action.payload
          });
          break;
          
        case 'CLEAR_VENTA':
          this.state$.next({
            ...currentState,
            ventaActual: null,
            clienteSeleccionado: null,
            carrito: [],
            subtotal: 0,
            igv: 0,
            total: 0,
            descuento: 0,
            pasoActual: 0
          });
          break;
      }
    });
  }

  // Actions
  setCliente(cliente: Cliente) {
    this.actions$.next({ type: 'SET_CLIENTE', payload: cliente });
  }

  addToCart(item: any) {
    this.actions$.next({ type: 'ADD_TO_CART', payload: item });
  }

  removeFromCart(itemId: number) {
    this.actions$.next({ type: 'REMOVE_FROM_CART', payload: itemId });
  }

  setActiveTab(index: number) {
    this.actions$.next({ type: 'SET_ACTIVE_TAB', payload: index });
  }

  setLoading(loading: boolean) {
    this.actions$.next({ type: 'SET_LOADING', payload: loading });
  }

  setVentas(ventas: VentaResponse[]) {
    this.actions$.next({ type: 'SET_VENTAS', payload: ventas });
  }

  clearVenta() {
    this.actions$.next({ type: 'CLEAR_VENTA' });
  }

  private calcularTotales() {
    const currentState = this.state$.value;
    const subtotal = currentState.carrito.reduce((sum, item) => sum + item.subtotal, 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv - currentState.descuento;

    this.state$.next({
      ...currentState,
      subtotal,
      igv,
      total
    });
  }

  // Getters para acceso directo
  get currentState(): VentaState {
    return this.state$.value;
  }

  get ventaActual(): VentaRequest | null {
    return this.state$.value.ventaActual;
  }

  get clienteSeleccionado(): Cliente | null {
    return this.state$.value.clienteSeleccionado;
  }

  get carrito(): any[] {
    return this.state$.value.carrito;
  }

  get total(): number {
    return this.state$.value.total;
  }
}
