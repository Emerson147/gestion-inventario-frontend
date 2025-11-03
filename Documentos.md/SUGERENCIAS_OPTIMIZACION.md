// SUGERENCIA: Crear componentes modulares

// 1. Header Component
@Component({
  selector: 'app-header-ventas',
  template: `<!-- Solo el header aquí -->`
})
export class HeaderVentasComponent { }

// 2. Control Caja Component  
@Component({
  selector: 'app-control-caja',
  template: `<!-- Panel de control de caja -->`
})
export class ControlCajaComponent { }

// 3. Diálogo Pago Component
@Component({
  selector: 'app-dialogo-pago', 
  template: `<!-- Formulario de pago -->`
})
export class DialogoPagoComponent { }

// 4. Tabs Ventas Component
@Component({
  selector: 'app-tabs-ventas',
  template: `<!-- Sistema de pestañas -->`
})
export class TabsVentasComponent { }