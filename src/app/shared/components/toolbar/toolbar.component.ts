import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';


export interface ToolbarAction {
  id: string;
  label: string;
  icon: string;
  cssClass?: string;
  severity?: 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast' | null;
  disabled?: boolean;
  tooltip?: string;
  permission?: {
    module: string;
    permission: string;
  };
  action: () => void;
}

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule],
  templateUrl: './toolbar.component.html'
})
export class ToolbarComponent {
  @Input() primaryActions: ToolbarAction[] = [];
  @Input() secondaryActions: ToolbarAction[] = [];
  @Output() actionExecuted = new EventEmitter<string>();

  showAction(): boolean {
    // Aquí puedes agregar lógica de permisos si es necesario
    return true;
  }

  executeAction(action: ToolbarAction): void {
    action.action();
    this.actionExecuted.emit(action.id);
  }
}