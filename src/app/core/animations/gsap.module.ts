// src/app/animations/gsap.module.ts
import { NgModule } from '@angular/core';
import { gsap } from 'gsap';

@NgModule({})
export class GsapModule {
  constructor() {
    // Inicialización global de GSAP y plugins necesarios
    // Asegurarse de que GSAP esté correctamente cargado
    if (gsap) {
      console.log('GSAP inicializado correctamente: versión', gsap.version);
    } else {
      console.error('GSAP no se ha cargado correctamente');
    }
  }
}
