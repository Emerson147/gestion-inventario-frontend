import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AdvancedSearchComponent } from './advanced-search.component';

describe('AdvancedSearchComponent', () => {
  let component: AdvancedSearchComponent;
  let fixture: ComponentFixture<AdvancedSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdvancedSearchComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdvancedSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.searchForm).toBeDefined();
    expect(component.searchForm.get('texto')?.value).toBe('');
    expect(component.searchForm.get('estados')?.value).toEqual([]);
  });

  it('should emit search event when valid filters exist', () => {
    spyOn(component.search, 'emit');
    
    // Set some filter values
    component.searchForm.patchValue({
      texto: 'test',
      cantidadMin: 10
    });
    
    component.onSearch();
    
    expect(component.search.emit).toHaveBeenCalled();
  });

  it('should clear all filters', () => {
    // Set some values
    component.searchForm.patchValue({
      texto: 'test',
      cantidadMin: 10
    });
    
    component.limpiarTodo();
    
    expect(component.searchForm.get('texto')?.value).toBe('');
    expect(component.searchForm.get('cantidadMin')?.value).toBeNull();
    expect(component.activeFiltros.length).toBe(0);
  });

  it('should update active filters when form changes', () => {
    component.searchForm.patchValue({
      texto: 'test producto'
    });
    
    expect(component.activeFiltros.length).toBeGreaterThan(0);
    expect(component.activeFiltros[0].key).toBe('texto');
  });
});