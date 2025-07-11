// 🔧 Script de Diagnóstico para Problema de Usuarios
// Ejecutar en la consola del navegador (F12 > Console)

console.log('🔧 Iniciando diagnóstico de usuarios...');

// Función para verificar el estado de autenticación
function verificarAutenticacion() {
  console.log('\n🔐 === VERIFICACIÓN DE AUTENTICACIÓN ===');
  
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  const user = localStorage.getItem('user');
  
  console.log('Token existe:', !!token);
  console.log('Refresh token existe:', !!refreshToken);
  console.log('Usuario existe:', !!user);
  
  if (token) {
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      console.log('Token decodificado:', decoded);
      console.log('Token expirado:', new Date(decoded.exp * 1000) < new Date());
    } catch (e) {
      console.error('Error al decodificar token:', e);
    }
  }
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('Datos del usuario:', userData);
    } catch (e) {
      console.error('Error al parsear datos del usuario:', e);
    }
  }
}

// Función para verificar la conectividad con el backend
async function verificarBackend() {
  console.log('\n🌐 === VERIFICACIÓN DE BACKEND ===');
  
  try {
    const response = await fetch('http://localhost:8080/api/usuarios?page=0&size=10', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status code:', response.status);
    console.log('Status text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Respuesta del servidor:', data);
      console.log('Número de usuarios:', data.content?.length || 0);
    } else {
      console.error('Error en la respuesta:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error de conexión:', error);
  }
}

// Función para verificar la configuración del environment
function verificarEnvironment() {
  console.log('\n⚙️ === VERIFICACIÓN DE CONFIGURACIÓN ===');
  
  // Intentar acceder a la configuración del environment
  try {
    // Esto solo funciona si el environment está disponible globalmente
    if (typeof window !== 'undefined' && window.environment) {
      console.log('Environment encontrado:', window.environment);
    } else {
      console.log('Environment no disponible globalmente');
    }
  } catch (e) {
    console.log('No se puede acceder al environment desde la consola');
  }
  
  console.log('URL esperada del API: http://localhost:8080/');
}

// Función para verificar el estado del componente Angular
function verificarComponente() {
  console.log('\n🔄 === VERIFICACIÓN DEL COMPONENTE ===');
  
  // Buscar elementos del DOM relacionados con usuarios
  const tablaUsuarios = document.querySelector('p-table');
  const cardsUsuarios = document.querySelectorAll('.col-12.sm\\:col-6.lg\\:col-4.xl\\:col-3');
  const loadingSpinner = document.querySelector('.pi-spin');
  const emptyMessage = document.querySelector('p-template[ptemplate="emptymessage"]');
  
  console.log('Tabla de usuarios encontrada:', !!tablaUsuarios);
  console.log('Cards de usuarios encontradas:', cardsUsuarios.length);
  console.log('Spinner de carga visible:', !!loadingSpinner);
  console.log('Mensaje de vacío visible:', !!emptyMessage);
  
  // Verificar si hay datos en el DOM
  const filasUsuarios = document.querySelectorAll('p-table tbody tr');
  console.log('Filas de usuarios en la tabla:', filasUsuarios.length);
}

// Función para verificar errores en la consola
function verificarErrores() {
  console.log('\n❌ === VERIFICACIÓN DE ERRORES ===');
  
  // Los errores ya deberían estar visibles en la consola
  console.log('Revisar los errores anteriores en la consola');
  console.log('Buscar mensajes que empiecen con:');
  console.log('- ❌ Error');
  console.log('- 🔍 Objeto de error');
  console.log('- 📋 Resumen del error');
}

// Función para generar un reporte completo
function generarReporte() {
  console.log('\n📊 === REPORTE COMPLETO ===');
  
  const reporte = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    autenticacion: {
      token: !!localStorage.getItem('token'),
      refreshToken: !!localStorage.getItem('refreshToken'),
      user: !!localStorage.getItem('user')
    },
    elementos: {
      tabla: !!document.querySelector('p-table'),
      cards: document.querySelectorAll('.col-12.sm\\:col-6.lg\\:col-4.xl\\:col-3').length,
      filas: document.querySelectorAll('p-table tbody tr').length
    }
  };
  
  console.log('Reporte:', reporte);
  
  // Copiar al portapapeles si es posible
  try {
    navigator.clipboard.writeText(JSON.stringify(reporte, null, 2));
    console.log('✅ Reporte copiado al portapapeles');
  } catch (e) {
    console.log('⚠️ No se pudo copiar al portapapeles');
  }
}

// Ejecutar todas las verificaciones
async function ejecutarDiagnosticoCompleto() {
  console.log('🚀 === DIAGNÓSTICO COMPLETO DE USUARIOS ===');
  
  verificarAutenticacion();
  await verificarBackend();
  verificarEnvironment();
  verificarComponente();
  verificarErrores();
  generarReporte();
  
  console.log('\n✅ Diagnóstico completado');
  console.log('📝 Revisar el reporte generado arriba');
}

// Ejecutar el diagnóstico automáticamente
ejecutarDiagnosticoCompleto();

// Exportar funciones para uso manual
window.diagnosticoUsuarios = {
  verificarAutenticacion,
  verificarBackend,
  verificarEnvironment,
  verificarComponente,
  verificarErrores,
  generarReporte,
  ejecutarDiagnosticoCompleto
};

console.log('\n💡 Funciones disponibles:');
console.log('- window.diagnosticoUsuarios.verificarAutenticacion()');
console.log('- window.diagnosticoUsuarios.verificarBackend()');
console.log('- window.diagnosticoUsuarios.ejecutarDiagnosticoCompleto()'); 