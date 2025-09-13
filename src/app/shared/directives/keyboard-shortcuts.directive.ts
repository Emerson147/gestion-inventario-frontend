import { Directive, HostListener, Input, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

@Directive({
  selector: '[appKeyboardShortcuts]',
  standalone: true
})
export class KeyboardShortcutsDirective {
  @Input() shortcuts: KeyboardShortcut[] = [];
  @Input() showHelpOnF1 = true;
  
  private messageService = inject(MessageService);

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Mostrar ayuda con F1
    if (event.key === 'F1' && this.showHelpOnF1) {
      event.preventDefault();
      this.showShortcutsHelp();
      return;
    }

    // Buscar shortcut coincidente
    const matchingShortcut = this.shortcuts.find(shortcut => 
      shortcut.key.toLowerCase() === event.key.toLowerCase() &&
      !!shortcut.ctrlKey === event.ctrlKey &&
      !!shortcut.altKey === event.altKey &&
      !!shortcut.shiftKey === event.shiftKey
    );

    if (matchingShortcut) {
      event.preventDefault();
      event.stopPropagation();
      
      try {
        matchingShortcut.action();
      } catch (error) {
        console.error('Error ejecutando shortcut:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al ejecutar la acción del teclado'
        });
      }
    }
  }

  private showShortcutsHelp(): void {
    if (this.shortcuts.length === 0) {
      this.messageService.add({
        severity: 'info',
        summary: 'Atajos de Teclado',
        detail: 'No hay atajos de teclado configurados para esta vista'
      });
      return;
    }

    const helpText = this.shortcuts
      .map(shortcut => {
        const keys = [];
        if (shortcut.ctrlKey) keys.push('Ctrl');
        if (shortcut.altKey) keys.push('Alt');
        if (shortcut.shiftKey) keys.push('Shift');
        keys.push(shortcut.key.toUpperCase());
        
        return `${keys.join(' + ')}: ${shortcut.description}`;
      })
      .join('\n');

    this.messageService.add({
      severity: 'info',
      summary: 'Atajos de Teclado Disponibles',
      detail: helpText,
      life: 8000
    });
  }
}

// Servicio para gestionar shortcuts globales
@Directive({
  selector: '[appGlobalShortcuts]',
  standalone: true
})
export class GlobalShortcutsDirective {
  private messageService = inject(MessageService);

  @HostListener('window:keydown', ['$event'])
  onGlobalKeyDown(event: KeyboardEvent): void {
    // Ignorar si el usuario está escribiendo en un input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Shortcuts globales comunes
    if (event.ctrlKey) {
      switch (event.key.toLowerCase()) {
        case 'k':
          event.preventDefault();
          this.focusGlobalSearch();
          break;
        case '/':
          event.preventDefault();
          this.focusGlobalSearch();
          break;
        case 'h':
          event.preventDefault();
          this.showGlobalHelp();
          break;
      }
    }

    // Shortcuts sin modificadores
    switch (event.key) {
      case 'Escape':
        this.closeModals();
        break;
    }
  }

  private focusGlobalSearch(): void {
    const searchInput = document.querySelector('input[placeholder*="Buscar"], input[placeholder*="buscar"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    } else {
      this.messageService.add({
        severity: 'info',
        summary: 'Búsqueda',
        detail: 'No se encontró un campo de búsqueda en esta vista'
      });
    }
  }

  private showGlobalHelp(): void {
    const helpText = [
      'Ctrl + K: Buscar',
      'Ctrl + /: Buscar',
      'Ctrl + H: Mostrar esta ayuda',
      'Escape: Cerrar modales',
      'F1: Ayuda contextual'
    ].join('\n');

    this.messageService.add({
      severity: 'info',
      summary: 'Atajos Globales',
      detail: helpText,
      life: 8000
    });
  }

  private closeModals(): void {
    // Cerrar modales de PrimeNG
    const modals = document.querySelectorAll('.p-dialog-mask');
    modals.forEach(modal => {
      const closeButton = modal.querySelector('.p-dialog-header-close') as HTMLElement;
      if (closeButton) {
        closeButton.click();
      }
    });

    // Cerrar overlays
    const overlays = document.querySelectorAll('.p-overlaypanel');
    overlays.forEach(overlay => {
      if (overlay.classList.contains('p-overlaypanel-visible')) {
        const closeButton = overlay.querySelector('.p-overlaypanel-close') as HTMLElement;
        if (closeButton) {
          closeButton.click();
        }
      }
    });
  }
}