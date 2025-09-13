import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LoadingState {
  [key: string]: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<LoadingState>({});
  private globalLoadingSubject = new BehaviorSubject<boolean>(false);

  public loading$ = this.loadingSubject.asObservable();
  public globalLoading$ = this.globalLoadingSubject.asObservable();

  /**
   * Establece el estado de loading para una operación específica
   */
  setLoading(key: string, loading: boolean): void {
    const currentState = this.loadingSubject.value;
    const newState = { ...currentState, [key]: loading };
    
    this.loadingSubject.next(newState);
    this.updateGlobalLoading(newState);
  }

  /**
   * Obtiene el estado de loading para una operación específica
   */
  isLoading(key: string): Observable<boolean> {
    return new Observable(observer => {
      this.loading$.subscribe(state => {
        observer.next(!!state[key]);
      });
    });
  }

  /**
   * Verifica si hay alguna operación en loading
   */
  isAnyLoading(): Observable<boolean> {
    return this.globalLoading$;
  }

  /**
   * Limpia el estado de loading para una operación específica
   */
  clearLoading(key: string): void {
    const currentState = this.loadingSubject.value;
    const newState = { ...currentState };
    delete newState[key];
    
    this.loadingSubject.next(newState);
    this.updateGlobalLoading(newState);
  }

  /**
   * Limpia todos los estados de loading
   */
  clearAllLoading(): void {
    this.loadingSubject.next({});
    this.globalLoadingSubject.next(false);
  }

  /**
   * Ejecuta una operación con loading automático
   */
  withLoading<T>(key: string, operation: Observable<T>): Observable<T> {
    return new Observable(observer => {
      this.setLoading(key, true);
      
      operation.subscribe({
        next: (value) => observer.next(value),
        error: (error) => {
          this.setLoading(key, false);
          observer.error(error);
        },
        complete: () => {
          this.setLoading(key, false);
          observer.complete();
        }
      });
    });
  }

  /**
   * Obtiene todos los estados de loading actuales
   */
  getCurrentLoadingStates(): LoadingState {
    return this.loadingSubject.value;
  }

  /**
   * Obtiene las operaciones que están actualmente en loading
   */
  getActiveLoadingOperations(): string[] {
    const currentState = this.loadingSubject.value;
    return Object.keys(currentState).filter(key => currentState[key]);
  }

  private updateGlobalLoading(state: LoadingState): void {
    const hasAnyLoading = Object.values(state).some(loading => loading);
    this.globalLoadingSubject.next(hasAnyLoading);
  }
}