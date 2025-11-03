# 🎫 Implementación de Impresión en Ticketera

## 📋 **Endpoints Backend Requeridos**

### **1. Imprimir en Ticketera**
```java
/**
 * Envía un comprobante a imprimir en ticketera
 */
@PostMapping("/{id}/imprimir-ticket")
@PreAuthorize("hasRole('ADMIN') or hasRole('FACTURACION') or hasRole('VENTAS')")
public ResponseEntity<Map<String, String>> imprimirEnTicketera(@PathVariable Long id) {
    log.info("Recibida solicitud para imprimir en ticketera comprobante ID: {}", id);
    
    try {
        // 1. Obtener el comprobante
        ComprobanteResponse comprobante = comprobanteService.obtenerComprobante(id);
        
        // 2. Generar formato de ticket
        String ticketContent = ticketService.generarTicket(comprobante);
        
        // 3. Enviar a la impresora ticketera
        boolean enviado = ticketeraService.imprimir(ticketContent);
        
        if (enviado) {
            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Ticket enviado a impresora correctamente");
            response.put("comprobanteId", id.toString());
            
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", "No se pudo enviar a la impresora"));
        }
        
    } catch (Exception e) {
        log.error("Error imprimiendo en ticketera comprobante ID: {}", id, e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("status", "error", "message", e.getMessage()));
    }
}
```

### **2. Configuración de Impresión**
```java
/**
 * Obtiene la configuración de impresión disponible
 */
@GetMapping("/configuracion-impresion")
@PreAuthorize("hasRole('ADMIN') or hasRole('FACTURACION') or hasRole('VENTAS')")
public ResponseEntity<Map<String, Object>> obtenerConfiguracionImpresion() {
    log.info("Recibida solicitud para obtener configuración de impresión");
    
    Map<String, Object> config = new HashMap<>();
    config.put("ticketeraDisponible", ticketeraService.isDisponible());
    config.put("modeloTicketera", ticketeraService.getModelo());
    config.put("anchoTicket", ticketeraService.getAnchoTicket());
    config.put("impresores", ticketeraService.getImpresorasDisponibles());
    
    return ResponseEntity.ok(config);
}
```

## 🔧 **Servicios Backend Necesarios**

### **1. TicketeraService**
```java
@Service
@Slf4j
public class TicketeraService {
    
    @Value("${app.ticketera.enabled:false}")
    private boolean ticketeraEnabled;
    
    @Value("${app.ticketera.puerto:COM1}")
    private String puertoTicketera;
    
    @Value("${app.ticketera.ancho:48}")
    private int anchoTicket;
    
    /**
     * Verifica si la ticketera está disponible
     */
    public boolean isDisponible() {
        return ticketeraEnabled && verificarConexion();
    }
    
    /**
     * Imprime contenido en la ticketera
     */
    public boolean imprimir(String contenido) {
        if (!isDisponible()) {
            log.warn("Ticketera no disponible");
            return false;
        }
        
        try {
            // Implementar lógica específica de tu ticketera
            // Ejemplo para ticketera térmica estándar:
            
            // 1. Abrir conexión serial/USB
            // 2. Enviar comandos de inicialización
            // 3. Enviar contenido formateado
            // 4. Enviar comando de corte (si aplica)
            // 5. Cerrar conexión
            
            enviarATicketera(contenido);
            log.info("Ticket impreso exitosamente");
            return true;
            
        } catch (Exception e) {
            log.error("Error imprimiendo en ticketera", e);
            return false;
        }
    }
    
    private void enviarATicketera(String contenido) {
        // Implementación específica según tu modelo de ticketera
        // Ejemplos comunes:
        
        // Para Epson TM-T20, TM-T88:
        // - Comandos ESC/POS
        // - Conexión serial o USB
        
        // Para Star Micronics:
        // - Comandos StarPRNT
        // - SDK específico
        
        // Para impresoras genéricas:
        // - Texto plano con saltos de línea
        // - Comandos básicos de formato
    }
    
    public String getModelo() {
        return "Ticketera Genérica"; // Implementar detección
    }
    
    public int getAnchoTicket() {
        return anchoTicket;
    }
    
    private boolean verificarConexion() {
        // Implementar verificación de conexión
        return true; // Por ahora siempre true
    }
}
```

### **2. TicketService**
```java
@Service
@Slf4j
public class TicketService {
    
    /**
     * Genera el contenido del ticket en formato texto
     */
    public String generarTicket(ComprobanteResponse comprobante) {
        StringBuilder ticket = new StringBuilder();
        
        // Encabezado
        ticket.append(centrarTexto("MI EMPRESA S.A.C.", 48)).append("\n");
        ticket.append(centrarTexto("RUC: 20123456789", 48)).append("\n");
        ticket.append(centrarTexto("Jr. Ejemplo 123 - Lima", 48)).append("\n");
        ticket.append(centrarTexto("Tel: (01) 123-4567", 48)).append("\n");
        ticket.append(repetirCaracter("-", 48)).append("\n");
        
        // Información del comprobante
        ticket.append(String.format("%-20s %s\n", "Comprobante:", 
                comprobante.getTipoDocumento() + " " + comprobante.getSerie() + "-" + comprobante.getNumero()));
        ticket.append(String.format("%-20s %s\n", "Fecha:", 
                formatearFecha(comprobante.getFechaEmision())));
        ticket.append(String.format("%-20s %s\n", "Cliente:", 
                comprobante.getCliente().getNombres() + " " + comprobante.getCliente().getApellidos()));
        
        if (comprobante.getCliente().getDni() != null) {
            ticket.append(String.format("%-20s %s\n", "DNI:", comprobante.getCliente().getDni()));
        }
        
        ticket.append(repetirCaracter("-", 48)).append("\n");
        
        // Detalles de productos
        ticket.append("DESCRIPCION           CANT  P.UNIT   TOTAL\n");
        ticket.append(repetirCaracter("-", 48)).append("\n");
        
        for (DetalleComprobante detalle : comprobante.getDetalles()) {
            String descripcion = truncarTexto(detalle.getDescripcion(), 20);
            ticket.append(String.format("%-20s %4.0f %7.2f %8.2f\n",
                    descripcion,
                    detalle.getCantidad(),
                    detalle.getPrecioUnitario(),
                    detalle.getSubtotal()));
        }
        
        ticket.append(repetirCaracter("-", 48)).append("\n");
        
        // Totales
        ticket.append(String.format("%30s %8.2f\n", "SUBTOTAL:", comprobante.getSubtotal()));
        ticket.append(String.format("%30s %8.2f\n", "IGV (18%):", comprobante.getIgv()));
        ticket.append(String.format("%30s %8.2f\n", "TOTAL:", comprobante.getTotal()));
        
        ticket.append(repetirCaracter("=", 48)).append("\n");
        
        // Pie de página
        ticket.append(centrarTexto("¡Gracias por su compra!", 48)).append("\n");
        ticket.append(centrarTexto("Vuelva pronto", 48)).append("\n");
        ticket.append("\n\n\n"); // Espacio para corte
        
        return ticket.toString();
    }
    
    private String centrarTexto(String texto, int ancho) {
        int espacios = (ancho - texto.length()) / 2;
        return " ".repeat(Math.max(0, espacios)) + texto;
    }
    
    private String repetirCaracter(String caracter, int veces) {
        return caracter.repeat(veces);
    }
    
    private String truncarTexto(String texto, int maxLength) {
        return texto.length() > maxLength ? texto.substring(0, maxLength) : texto;
    }
    
    private String formatearFecha(LocalDateTime fecha) {
        return fecha.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
    }
}
```

## ⚙️ **Configuración**

### **application.yml**
```yaml
app:
  ticketera:
    enabled: true
    puerto: "COM1"  # o /dev/ttyUSB0 en Linux
    ancho: 48       # caracteres por línea
    modelo: "EPSON_TM_T20"
    velocidad: 9600
    timeout: 5000
```

## 🔌 **Opciones de Implementación Física**

### **1. Ticketera Térmica (Recomendado)**
- **Modelos**: Epson TM-T20, TM-T88, Star TSP143
- **Conexión**: USB, Serial, Ethernet
- **Protocolo**: ESC/POS, StarPRNT
- **Ventajas**: Rápida, silenciosa, sin tinta

### **2. Implementación con Librerías Java**
```xml
<!-- Para Epson -->
<dependency>
    <groupId>com.epson</groupId>
    <artifactId>epson-escpos</artifactId>
    <version>1.0.0</version>
</dependency>

<!-- Para comunicación serial -->
<dependency>
    <groupId>org.scream3r</groupId>
    <artifactId>jssc</artifactId>
    <version>2.8.0</version>
</dependency>
```

### **3. Comandos ESC/POS Básicos**
```java
// Comandos comunes para ticketeras térmicas
private static final byte[] INIT = {0x1B, 0x40}; // Inicializar
private static final byte[] CORTE = {0x1D, 0x56, 0x41}; // Cortar papel
private static final byte[] CENTRO = {0x1B, 0x61, 0x01}; // Centrar texto
private static final byte[] IZQUIERDA = {0x1B, 0x61, 0x00}; // Alinear izquierda
```

## 🚀 **Próximos Pasos**

1. **Implementar los endpoints** en tu controlador
2. **Crear los servicios** TicketeraService y TicketService
3. **Configurar la conexión** con tu ticketera específica
4. **Probar la impresión** desde el frontend
5. **Ajustar el formato** según tus necesidades

¿Tienes algún modelo específico de ticketera o prefieres que te ayude con alguna implementación particular?