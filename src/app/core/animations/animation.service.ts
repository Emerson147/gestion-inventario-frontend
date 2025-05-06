// src/app/animations/animation.service.ts
import { Injectable } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Registrar los plugins
gsap.registerPlugin(ScrollTrigger);

/**
 * Tipos para las opciones de animación
 */
export interface BaseAnimationOptions {
  duration?: number;
  ease?: string;
  delay?: number;
}

export interface EntranceAnimationOptions extends BaseAnimationOptions {
  direction?: 'up' | 'down' | 'left' | 'right';
  stagger?: number;
  distance?: number;
}

export interface HoverAnimationOptions extends BaseAnimationOptions {
  scale?: number;
  color?: string;
  brightness?: number;
}

export interface ButtonAnimationOptions extends BaseAnimationOptions {
  loadingScale?: number;
  loadingOpacity?: number;
  successScale?: number;
  successColor?: string;
  errorColor?: string;
}

export interface ShakeAnimationOptions extends BaseAnimationOptions {
  intensity?: number;
}

export interface ScrollAnimationOptions extends BaseAnimationOptions {
  trigger?: string | Element;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  markers?: boolean;
  pin?: boolean;
  distance?: number;
  stagger?: number;
}


/**
 * Servicio para manejar animaciones GSAP en toda la aplicación
 * Proporciona métodos pre-configurados para animaciones comunes
 */
@Injectable({
  providedIn: 'root'
})
export class AnimationService {

  constructor() {
    // Inicialización de plugins o configuraciones globales
  }

  /**
   * Verifica si un elemento existe y es válido para animaciones
   * @param element Elemento a verificar
   * @returns Booleano que indica si el elemento es válido
   */
  private ensureElement(element: any): boolean {
    return element !== null && element !== undefined;
  }

  // ========== ANIMACIONES DE ELEMENTOS BÁSICOS ==========

  /**
   * Anima la sacudida de un elemento (efecto de error o alerta)
   * @param element Elemento HTML a animar
   * @param options Opciones de animación
   * @returns Instancia de la animación GSAP
   */
  shakeElement(element: HTMLElement, options: ShakeAnimationOptions = {}) {
    if (!this.ensureElement(element)) return null;

    const {
      intensity = 1,
      duration = 0.6,
      ease = 'power2.inOut'
    } = options;

    // Factor de intensidad aplicado a los valores de movimiento
    const factor = intensity * 10;

    return gsap.to(element, {
      keyframes: {
        x: [-factor, factor, -factor, factor, -factor/2, factor/2, -factor/5, factor/5, 0]
      },
      duration,
      ease
    });
  }

  /**
   * Animación de botón durante estado de carga
   * @param button Elemento botón
   * @param options Opciones de animación
   * @returns Instancia de la animación GSAP
   */
  buttonLoadingAnimation(button: HTMLElement, options: ButtonAnimationOptions = {}) {
    if (!this.ensureElement(button)) return null;

    const {
      loadingScale = 0.95,
      loadingOpacity = 0.8,
      duration = 0.2
    } = options;

    return gsap.timeline()
      .to(button, {
        scale: loadingScale,
        opacity: loadingOpacity,
        duration
      });
  }

  /**
   * Animación de botón tras completarse con éxito
   * @param button Elemento botón
   * @param options Opciones de animación
   * @returns Instancia de la animación GSAP
   */
  buttonSuccessAnimation(button: HTMLElement, options: ButtonAnimationOptions = {}) {
    if (!this.ensureElement(button)) return null;

    const {
      successScale = 1.05,
      successColor = 'var(--green-500)',
      duration = 0.3
    } = options;

    return gsap.to(button, {
      scale: successScale,
      backgroundColor: successColor,
      duration
    });
  }

  /**
   * Animación de botón tras completarse con error
   * @param button Elemento botón
   * @param options Opciones de animación
   * @returns Instancia de la animación GSAP
   */
  buttonErrorAnimation(button: HTMLElement, options: ButtonAnimationOptions = {}) {
    if (!this.ensureElement(button)) return null;

    const {
      errorColor = 'var(--red-500)',
      duration = 0.3
    } = options;

    const defaultColor = 'var(--primary-color)';

    return gsap.timeline()
      .to(button, {
        scale: 1,
        backgroundColor: errorColor,
        duration,
        yoyo: true,
        repeat: 1
      })
      .to(button, {
        backgroundColor: defaultColor,
        duration
      });
  }

  // ========== ANIMACIONES DE ENTRADA ==========

  /**
   * Animación de entrada para páginas completas
   * @param container Elemento contenedor de la página
   * @param options Opciones de animación
   * @returns Instancia de la animación GSAP
   */
  pageEntrance(container: HTMLElement, options: EntranceAnimationOptions = {}) {
    if (!this.ensureElement(container)) return null;

    const {
      duration = 1,
      ease = 'power3.out',
      delay = 0
    } = options;

    return gsap.timeline({defaults: {ease}})
      .from(container, {
        opacity: 0,
        duration,
        delay
      });
  }

  /**
   * Animación de entrada para tarjetas y paneles
   * @param element Elemento tarjeta
   * @param options Opciones de animación
   * @returns Instancia de la animación GSAP
   */
  cardEntrance(element: HTMLElement, options: EntranceAnimationOptions = {}) {
    if (!this.ensureElement(element)) return null;

    const {
      duration = 0.7,
      ease = 'power3.out',
      delay = 0
    } = options;

    return gsap.timeline({defaults: {ease}})
      .from(element, {
        opacity: 0,
        scale: 0.9,
        duration,
        delay
      });
  }

  /**
   * Animación de entrada para elementos de cabecera
   * @param elements Array de elementos de cabecera
   * @param options Opciones de animación
   * @returns Instancia de la animación GSAP
   */
  headerElementsEntrance(elements: HTMLElement[], options: EntranceAnimationOptions = {}) {
    if (!elements || elements.length === 0) return null;

    const {
      duration = 0.6,
      ease = 'power3.out',
      stagger = 0.2,
      delay = 0,
      distance = 20
    } = options;

    return gsap.timeline({defaults: {ease}})
      .from(elements, {
        opacity: 0,
        y: -distance,
        stagger,
        duration,
        delay
      });
  }

  /**
   * Animación de entrada para textos desde diferentes direcciones
   * @param elements Array de elementos de texto
   * @param options Opciones de animación
   * @returns Instancia de la animación GSAP
   */
  textEntrance(elements: HTMLElement[], options: EntranceAnimationOptions = {}) {
    if (!elements || elements.length === 0) return null;

    const {
      duration = 0.5,
      ease = 'power3.out',
      stagger = 0.2,
      delay = 0,
      direction = 'up',
      distance = 20
    } = options;

    const coordinates = {
      up: {y: distance, x: 0},
      down: {y: -distance, x: 0},
      left: {y: 0, x: distance},
      right: {y: 0, x: -distance}
    };

    return gsap.timeline({defaults: {ease}})
      .from(elements, {
        opacity: 0,
        y: coordinates[direction].y,
        x: coordinates[direction].x,
        stagger,
        duration,
        delay
      });
  }

  /**
   * Animación de entrada para campos de formulario
   * @param elements Array de elementos de formulario
   * @param options Opciones de animación
   * @returns Instancia de la animación GSAP
   */
  formFieldsEntrance(elements: HTMLElement[], options: EntranceAnimationOptions = {}) {
    if (!elements || elements.length === 0) return null;

    const {
      duration = 0.6,
      ease = 'power3.out',
      stagger = 0.2,
      delay = 0,
      direction = 'left',
      distance = 30
    } = options;

    const coordinates = {
      up: {y: distance, x: 0},
      down: {y: -distance, x: 0},
      left: {y: 0, x: -distance},
      right: {y: 0, x: distance}
    };

    return gsap.timeline({defaults: {ease}})
      .from(elements, {
        opacity: 0,
        y: coordinates[direction].y,
        x: coordinates[direction].x,
        stagger,
        duration,
        delay
      });
  }

  /**
   * Animación de entrada para enlaces y menús
   * @param elements Array de elementos de enlace
   * @param options Opciones de animación
   * @returns Instancia de la animación GSAP
   */
  linksEntrance(elements: HTMLElement[] | Element[], options: EntranceAnimationOptions = {}) {
    if (!elements || elements.length === 0) return null;

    const {
      duration = 0.4,
      ease = 'power3.out',
      stagger = 0.1,
      delay = 0,
      distance = 10
    } = options;

    return gsap.timeline({defaults: {ease}})
      .from(elements, {
        opacity: 0,
        y: distance,
        stagger,
        duration,
        delay
      });
  }

  /**
   * Animación de entrada para botones
   * @param element Elemento botón
   * @param options Opciones de animación
   * @returns Instancia de la animación GSAP
   */
  buttonEntrance(element: HTMLElement, options: EntranceAnimationOptions = {}) {
    if (!this.ensureElement(element)) return null;

    const {
      duration = 0.5,
      ease = 'power3.out',
      delay = 0
    } = options;

    return gsap.timeline({defaults: {ease}})
      .from(element, {
        opacity: 0,
        scale: 0.8,
        duration,
        delay
      });
  }

  // ========== ANIMACIONES BASADAS EN SCROLL ==========

  /**
   * Configura animaciones basadas en scroll
   * @param element Elemento a animar
   * @param options Opciones de animación y scroll
   * @returns Instancia de ScrollTrigger
   */
  setupScrollAnimation(element: HTMLElement, options: ScrollAnimationOptions) {
    if (!this.ensureElement(element)) return null;

    const {
      trigger = element,
      start = 'top 80%',
      end = 'bottom 20%',
      scrub = false,
      markers = false,
      pin = false,
      duration = 1,
      ease = 'power2.out'
    } = options;

    return gsap.from(element, {
      opacity: 0,
      y: 50,
      duration,
      ease,
      scrollTrigger: {
        trigger,
        start,
        end,
        scrub,
        markers,
        pin,
        toggleActions: 'play none none reverse'
      }
    });
  }

  /**
   * Configura animación de revelación de elementos mientras se hace scroll
   * @param elements Elementos a animar
   * @param options Opciones de animación
   */
  setupScrollReveal(elements: HTMLElement[] | NodeListOf<Element> | string, options: ScrollAnimationOptions = {}): gsap.core.Timeline | null {
    const {
      duration = 0.8,
      ease = 'power2.out',
      stagger = 0.2,
      distance = 50,
      start = 'top 80%'
    } = options;

    // Convertir selector a elementos si es necesario
    let elementsArray: Element[];
    if (typeof elements === 'string') {
      elementsArray = Array.from(document.querySelectorAll(elements));
    } else if (elements instanceof NodeList) {
      elementsArray = Array.from(elements);
    } else {
      elementsArray = elements;
    }

    if (!elementsArray.length) return null;

    // Crear animación para cada elemento
    const tl = gsap.timeline();

    elementsArray.forEach(el => {
      tl.add(
        gsap.from(el, {
          opacity: 0,
          y: distance,
          duration,
          ease,
          scrollTrigger: {
            trigger: el,
            start,
            toggleActions: 'play none none none'
          }
        }), 0
      );
    });

    return tl;
  }

  /**
   * Configura efecto de paralaje para fondos
   * @param element Elemento de fondo
   * @param speed Velocidad del efecto (1 = normal, <1 más lento, >1 más rápido)
   */
  setupParallaxEffect(element: HTMLElement, speed: number = 0.5) {
    if (!this.ensureElement(element)) return null;

    return gsap.to(element, {
      y: () => {
        return -(ScrollTrigger.maxScroll(window) * speed);
      },
      ease: 'none',
      scrollTrigger: {
        start: 'top top',
        end: 'bottom bottom',
        invalidateOnRefresh: true,
        scrub: true
      }
    });
  }

  // ========== ANIMACIONES DE INTERACCIÓN ==========

  /**
   * Configura efectos hover para enlaces
   * @param selector Selector CSS o elementos
   * @param options Opciones de animación
   */
  setupLinkHoverEffects(selector: string | HTMLElement[], options: HoverAnimationOptions = {}) {
    const {
      duration = 0.3,
      ease = 'power2.out',
      scale = 1.05,
      color = 'var(--primary-color-darker, #0056b3)'
    } = options;

    // Convertir selector a elementos si es necesario
    let elements: Element[];
    if (typeof selector === 'string') {
      elements = Array.from(document.querySelectorAll(selector));
    } else {
      elements = selector;
    }

    elements.forEach((link: any) => {
      const originalColor = window.getComputedStyle(link).color;

      link.addEventListener('mouseenter', () => {
        gsap.to(link, {
          color,
          scale,
          duration,
          ease
        });
      });

      link.addEventListener('mouseleave', () => {
        gsap.to(link, {
          color: originalColor,
          scale: 1,
          duration,
          ease
        });
      });
    });
  }

  /**
   * Configura efecto hover para botones
   * @param button Elemento botón
   * @param options Opciones de animación
   */
  setupButtonHoverEffect(button: HTMLElement, options: HoverAnimationOptions = {}) {
    if (!this.ensureElement(button)) return;

    const {
      duration = 0.3,
      ease = 'power2.out',
      scale = 1.03,
      brightness = 1.1
    } = options;

    button.addEventListener('mouseenter', () => {
      gsap.to(button, {
        scale,
        filter: `brightness(${brightness})`,
        duration,
        ease
      });
    });

    button.addEventListener('mouseleave', () => {
      gsap.to(button, {
        scale: 1,
        filter: 'brightness(1)',
        duration,
        ease
      });
    });
  }

  // ========== ANIMACIONES DE DIÁLOGOS Y MODALES ==========

  /**
   * Animación de entrada para diálogos y modales
   * @param dialog Elemento diálogo
   * @param options Opciones de animación
   * @returns Instancia de la animación GSAP
   */
  dialogEntrance(dialog: HTMLElement, options: EntranceAnimationOptions = {}) {
    if (!this.ensureElement(dialog)) return null;

    const {
      duration = 0.5,
      ease = 'back.out(1.7)',
      delay = 0
    } = options;

    // Mostrar overlay con fade in
    gsap.fromTo(
      'body',
      {
        backgroundColor: 'rgba(0,0,0,0)'
      },
      {
        backgroundColor: 'rgba(0,0,0,0.3)',
        duration: 0.3
      }
    );

    // Animar el diálogo
    return gsap.fromTo(
      dialog,
      {
        opacity: 0,
        scale: 0.7,
        y: 20
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration,
        delay,
        ease
      }
    );
  }

  /**
   * Animación de salida para diálogos y modales
   * @param dialog Elemento diálogo
   * @param options Opciones de animación
   * @param onComplete Función a ejecutar al completar
   * @returns Instancia de la animación GSAP
   */
  dialogExit(dialog: HTMLElement, options: BaseAnimationOptions = {}, onComplete?: () => void) {
    if (!this.ensureElement(dialog)) return null;

    const {
      duration = 0.4,
      ease = 'power2.in',
      delay = 0
    } = options;

    // Eliminar overlay
    gsap.to('body', {
      backgroundColor: 'rgba(0,0,0,0)',
      duration: 0.2,
      delay: delay + 0.1
    });

    // Animar salida del diálogo
    return gsap.to(dialog, {
      opacity: 0,
      scale: 0.9,
      y: -10,
      duration,
      delay,
      ease,
      onComplete
    });
  }

  /**
   * Animación para elementos dentro de un diálogo
   * @param elements Elementos dentro del diálogo
   * @param options Opciones de animación
   * @returns Instancia de la animación GSAP
   */
  dialogContentEntrance(elements: HTMLElement[] | NodeListOf<Element>, options: EntranceAnimationOptions = {}) {
    if (!elements || (elements instanceof NodeList && elements.length === 0) ||
      (Array.isArray(elements) && elements.length === 0)) return null;

    const {
      duration = 0.4,
      ease = 'power3.out',
      stagger = 0.1,
      delay = 0.2,
      distance = 20
    } = options;

    return gsap.fromTo(
      elements,
      {
        opacity: 0,
        y: distance
      },
      {
        opacity: 1,
        y: 0,
        stagger,
        duration,
        delay,
        ease
      }
    );
  }

  // ========== ANIMACIONES DE NOTIFICACIONES ==========

  /**
   * Animación para toast o notificaciones
   * @param element Elemento de notificación
   * @param options Opciones de animación
   * @param autoHide Si la notificación debe ocultarse automáticamente
   * @param hideDelay Tiempo en segundos antes de ocultar
   * @returns Timeline de GSAP
   */
  toastNotification(element: HTMLElement, options: EntranceAnimationOptions = {}, autoHide: boolean = true, hideDelay: number = 3) {
    if (!this.ensureElement(element)) return null;

    const {
      duration = 0.5,
      ease = 'power3.out',
      delay = 0
    } = options;

    const tl = gsap.timeline();

    // Entrada
    tl.fromTo(element,
      {
        opacity: 0,
        y: -50,
        scale: 0.9
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration,
        ease,
        delay
      }
    );

    // Salida automática
    if (autoHide) {
      tl.to(element, {
        opacity: 0,
        y: -20,
        scale: 0.9,
        duration: 0.4,
        delay: hideDelay,
        ease: 'power3.in'
      });
    }

    return tl;
  }

  /**
   * Animación de salida exitosa
   * @param element Elemento a animar
   * @param options Opciones de animación
   * @param onComplete Función a ejecutar al completar
   * @returns Instancia de la animación GSAP
   */
  successExit(element: HTMLElement, options: BaseAnimationOptions = {}, onComplete?: () => void) {
    if (!this.ensureElement(element)) return null;

    const {
      duration = 0.8,
      ease = 'back.in(1.7)',
      delay = 0
    } = options;

    return gsap.to(element, {
      y: -50,
      opacity: 0,
      duration,
      delay,
      ease,
      onComplete
    });
  }

  // ========== ANIMACIONES DE LISTAS ==========

  /**
   * Animación para elementos de lista (staggered)
   * @param elements Elementos de la lista
   * @param options Opciones de animación
   * @returns Instancia de la animación GSAP
   */
  listItemsEntrance(elements: HTMLElement[] | NodeListOf<Element>, options: EntranceAnimationOptions = {}) {
    if (!elements || (elements instanceof NodeList && elements.length === 0) ||
      (Array.isArray(elements) && elements.length === 0)) return null;

    const {
      duration = 0.5,
      ease = 'power3.out',
      stagger = 0.08,
      delay = 0,
      direction = 'up',
      distance = 15
    } = options;

    const coordinates = {
      up: {y: distance, x: 0},
      down: {y: -distance, x: 0},
      left: {y: 0, x: -distance},
      right: {y: 0, x: distance}
    };

    return gsap.from(elements, {
      opacity: 0,
      y: coordinates[direction].y,
      x: coordinates[direction].x,
      stagger,
      duration,
      delay,
      ease
    });
  }

  /**
   * Animación para ordenamiento de listas (cambio de posición)
   * @param element Elemento a reordenar
   * @param newPosition Nueva posición (top, left)
   * @param options Opciones de animación
   * @returns Instancia de la animación GSAP
   */
  listItemReorder(element: HTMLElement, newPosition: {top: number, left: number}, options: BaseAnimationOptions = {}) {
    if (!this.ensureElement(element)) return null;

    const {
      duration = 0.5,
      ease = 'power2.out',
      delay = 0
    } = options;

    return gsap.to(element, {
      top: newPosition.top,
      left: newPosition.left,
      duration,
      delay,
      ease
    });
  }

  // ========== ANIMACIONES PARA LOGIN/REGISTRO ==========

  /**
   * Anima la entrada del formulario de login
   * @param formElement El formulario o su contenedor
   * @param options Opciones de animación
   * @returns Timeline de GSAP
   */
  animateLoginForm(formElement: HTMLElement, options: EntranceAnimationOptions = {}) {
    if (!this.ensureElement(formElement)) return null;

    const {
      duration = 0.8,
      ease = 'power3.out',
      stagger = 0.15,
      delay = 0
    } = options;

    const tl = gsap.timeline({defaults: {ease}});

    // Animación principal del formulario
    tl.from(formElement, {
      opacity: 0,
      y: 30,
      duration,
      delay
    });

    // Animar los elementos internos
    const formFields = formElement.querySelectorAll('p-floatLabel, button, .links-container');
    if (formFields.length) {
      tl.from(formFields, {
        opacity: 0,
        y: 20,
        stagger,
        duration: 0.5
      }, "-=0.4");
    }

    // Efecto especial para el botón de login
    const loginBtn = formElement.querySelector('.login-button button');
    if (loginBtn) {
      tl.from(loginBtn, {
        scale: 0.9,
        duration: 0.3,
        ease: 'back.out(1.5)'
      }, "-=0.2");

      this.setupButtonHoverEffect(loginBtn as HTMLElement);
    }

    return tl;
  }

  /**
   * Animación para transición entre formularios (login/registro/recuperar contraseña)
   * @param currentForm Formulario actual a ocultar
   * @param newForm Nuevo formulario a mostrar
   * @param direction Dirección de la animación
   * @returns Timeline de GSAP
   */
  switchForms(currentForm: HTMLElement, newForm: HTMLElement, direction: 'left' | 'right' = 'right') {
    if (!this.ensureElement(currentForm) || !this.ensureElement(newForm)) return null;

    const xDirection = direction === 'right' ? 100 : -100;

    const tl = gsap.timeline();

    // Ocultar formulario actual
    tl.to(currentForm, {
      opacity: 0,
      x: -xDirection,
      duration: 0.5,
      ease: 'power2.inOut'
    });

    // Mostrar nuevo formulario
    tl.fromTo(newForm,
      {
        opacity: 0,
        x: xDirection
      },
      {
        opacity: 1,
        x: 0,
        duration: 0.5,
        ease: 'power2.inOut'
      }, "-=0.3");

    return tl;
  }

  // ========== ANIMACIONES PARA DATOS Y GRÁFICOS ==========

  /**
   * Animación para barras de progreso o gráficos de barras
   * @param element Elemento a animar
   * @param fromValue Valor inicial
   * @param toValue Valor final
   * @param options Opciones de animación
   * @param onUpdate Función a ejecutar en cada actualización
   * @returns Instancia de la animación GSAP
   */
  animateValue(element: HTMLElement, fromValue: number, toValue: number, options: BaseAnimationOptions = {}, onUpdate?: (value: number) => void) {
    if (!this.ensureElement(element)) return null;

    const {
      duration = 1.5,
      ease = 'power2.out',
      delay = 0
    } = options;

    // Objeto para la animación
    const obj = { value: fromValue };

    return gsap.to(obj, {
      value: toValue,
      duration,
      delay,
      ease,
      onUpdate: function() {
        // Redondear a 1 decimal
        const value = Math.round(obj.value * 10) / 10;

        // Si hay función de actualización, ejecutarla
        if (onUpdate) {
          onUpdate(value);
        } else {
          // Por defecto, actualizar el contenido del elemento
          element.textContent = value.toString();
        }
      }
    });
  }

  /**
   * Animación para gráficos circulares o de dona
   * @param element Elemento SVG o canvas
   * @param fromAngle Ángulo inicial (grados)
   * @param toAngle Ángulo final (grados)
   * @param options Opciones de animación
   * @param onUpdate Función para actualizar el gráfico
   * @returns Instancia de la animación GSAP
   */
  animateChart(element: HTMLElement, fromAngle: number, toAngle: number, options: BaseAnimationOptions = {}, onUpdate?: (angle: number) => void) {
    if (!this.ensureElement(element)) return null;

    const {
      duration = 1.5,
      ease = 'power2.inOut',
      delay = 0
    } = options;

    // Objeto para la animación
    const obj = { angle: fromAngle };

    return gsap.to(obj, {
      angle: toAngle,
      duration,
      delay,
      ease,
      onUpdate: function() {
        const angle = Math.round(obj.angle);

        // Si hay función de actualización, ejecutarla
        if (onUpdate) {
          onUpdate(angle);
        }
      }
    });
  }

  // ========== ANIMACIONES PARA TRANSICIÓN ENTRE PÁGINAS ==========

  /**
   * Animación de transición entre páginas con efecto de desvanecimiento
   * @param currentPage Página actual que se va a ocultar
   * @param newPage Nueva página que se va a mostrar
   * @param options Opciones de animación
   * @returns Timeline de GSAP
   */
  pageTransitionFade(currentPage: HTMLElement, newPage: HTMLElement, options: BaseAnimationOptions = {}) {
    if (!this.ensureElement(currentPage) || !this.ensureElement(newPage)) return null;

    const {
      duration = 0.8,
      ease = 'power2.inOut',
      delay = 0
    } = options;

    const tl = gsap.timeline();

    // Ocultar página actual
    tl.to(currentPage, {
      opacity: 0,
      duration: duration / 2,
      ease,
      delay
    });

    // Mostrar nueva página
    tl.fromTo(newPage,
      {
        opacity: 0
      },
      {
        opacity: 1,
        duration: duration / 2,
        ease
      }
    );

    return tl;
  }

  /**
   * Animación de transición entre páginas con efecto de deslizamiento
   * @param currentPage Página actual
   * @param newPage Nueva página
   * @param direction Dirección del deslizamiento
   * @param options Opciones de animación
   * @returns Timeline de GSAP
   */
  pageTransitionSlide(currentPage: HTMLElement, newPage: HTMLElement, direction: 'left' | 'right' | 'up' | 'down' = 'left', options: BaseAnimationOptions = {}) {
    if (!this.ensureElement(currentPage) || !this.ensureElement(newPage)) return null;

    const {
      duration = 1,
      ease = 'power2.inOut',
      delay = 0
    } = options;

    const coordinates = {
      left: { xFrom: '100%', xTo: '-100%', yFrom: '0%', yTo: '0%' },
      right: { xFrom: '-100%', xTo: '100%', yFrom: '0%', yTo: '0%' },
      up: { xFrom: '0%', xTo: '0%', yFrom: '100%', yTo: '-100%' },
      down: { xFrom: '0%', xTo: '0%', yFrom: '-100%', yTo: '100%' }
    };

    const tl = gsap.timeline();

    // Preparar nueva página
    gsap.set(newPage, {
      x: coordinates[direction].xFrom || 0,
      y: coordinates[direction].yFrom || 0,
      opacity: 1
    });

    // Animar ambas páginas
    tl.to(currentPage, {
      x: coordinates[direction].xTo || 0,
      y: coordinates[direction].yTo || 0,
      duration,
      ease,
      delay
    }, 0);

    tl.to(newPage, {
      x: 0,
      y: 0,
      duration,
      ease,
      delay
    }, 0);

    return tl;
  }

  /**
   * Transición entre páginas con efecto 3D
   * @param currentPage Página actual
   * @param newPage Nueva página
   * @param options Opciones de animación
   * @returns Timeline de GSAP
   */
  pageTransition3D(currentPage: HTMLElement, newPage: HTMLElement, options: BaseAnimationOptions = {}) {
    if (!this.ensureElement(currentPage) || !this.ensureElement(newPage)) return null;

    const {
      duration = 1.2,
      ease = 'power3.inOut',
      delay = 0
    } = options;

    const tl = gsap.timeline();

    // Asegurar que el contenedor tiene perspective
    const container = currentPage.parentElement;
    if (container) {
      gsap.set(container, { perspective: 1000 });
    }

    // Preparar nueva página
    gsap.set(newPage, {
      rotationY: 90,
      opacity: 0
    });

    // Animar salida de página actual
    tl.to(currentPage, {
      rotationY: -90,
      opacity: 0,
      duration: duration / 2,
      ease,
      delay
    });

    // Animar entrada de nueva página
    tl.to(newPage, {
      rotationY: 0,
      opacity: 1,
      duration: duration / 2,
      ease
    });

    return tl;
  }

  // ========== ANIMACIONES ADICIONALES ==========

  /**
   * Animación de carga tipo pulso
   * @param element Elemento a animar
   * @param options Opciones de animación
   * @returns Instancia de la animación GSAP
   */
  pulseAnimation(element: HTMLElement, options: BaseAnimationOptions = {}) {
    if (!this.ensureElement(element)) return null;

    const {
      duration = 1.5,
      ease = 'power2.inOut'
    } = options;

    return gsap.timeline({ repeat: -1 })
      .to(element, {
        scale: 1.05,
        opacity: 0.8,
        duration: duration / 2,
        ease
      })
      .to(element, {
        scale: 1,
        opacity: 1,
        duration: duration / 2,
        ease
      });
  }

  /**
   * Animación de contorno brillante (efecto de enfoque)
   * @param element Elemento a animar
   * @param color Color del brillo (por defecto: azul primario)
   * @param options Opciones de animación
   * @returns Instancia de la animación GSAP
   */
  glowEffect(element: HTMLElement, color: string = 'rgba(0, 123, 255, 0.6)', options: BaseAnimationOptions = {}) {
    if (!this.ensureElement(element)) return null;

    const {
      duration = 1,
      ease = 'power2.inOut'
    } = options;

    // Guardar el box-shadow original
    const originalShadow = window.getComputedStyle(element).boxShadow;

    return gsap.timeline({ repeat: -1, yoyo: true })
      .to(element, {
        boxShadow: `0 0 15px 5px ${color}`,
        duration,
        ease
      });
  }

  /**
   * Animación de typahead (efecto máquina de escribir)
   * @param element Elemento donde se escribirá el texto
   * @param text Texto completo a escribir
   * @param options Opciones de animación
   * @returns Timeline de GSAP
   */
  typewriterEffect(element: HTMLElement, text: string, options: BaseAnimationOptions = {}) {
    if (!this.ensureElement(element)) return null;

    const {
      duration = 2, // Duración total
      delay = 0
    } = options;

    // Calcular velocidad de caracteres basado en duración total
    const charsPerSecond = text.length / duration;

    // Limpiar el elemento
    element.textContent = '';

    const tl = gsap.timeline({ delay });

    // Añadir un caracter a la vez
    for (let i = 0; i < text.length; i++) {
      tl.add(() => {
        element.textContent = text.substring(0, i + 1);
      }, i / charsPerSecond);
    }

    return tl;
  }

  /**
   * Animación de desenfoque y enfoque (útil para transiciones)
   * @param element Elemento a animar
   * @param options Opciones de animación
   * @returns Instancia de la animación GSAP
   */
  blurAnimation(element: HTMLElement, options: BaseAnimationOptions = {}) {
    if (!this.ensureElement(element)) return null;

    const {
      duration = 0.5,
      ease = 'power2.inOut',
      delay = 0
    } = options;

    return gsap.timeline()
      .to(element, {
        filter: 'blur(10px)',
        opacity: 0.8,
        duration: duration / 2,
        ease,
        delay
      })
      .to(element, {
        filter: 'blur(0px)',
        opacity: 1,
        duration: duration / 2,
        ease
      });
  }

  /**
   * Animación de partículas o confeti (para celebraciones)
   * @param container Contenedor donde se crearán las partículas
   * @param particleCount Número de partículas
   * @param duration Duración de la animación
   * @returns Timeline de GSAP
   */
  confettiAnimation(container: HTMLElement, particleCount: number = 50, duration: number = 2) {
    if (!this.ensureElement(container)) return null;

    const particles: HTMLElement[] = [];
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4'];

    // Crear partículas
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'absolute';
      particle.style.width = '10px';
      particle.style.height = '10px';
      particle.style.borderRadius = '50%';
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

      container.appendChild(particle);
      particles.push(particle);

      // Posición inicial
      gsap.set(particle, {
        x: container.offsetWidth / 2,
        y: container.offsetHeight / 2
      });
    }

    // Animar partículas
    const tl = gsap.timeline();

    particles.forEach(particle => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 200;

      tl.to(particle, {
        x: `+=${Math.cos(angle) * distance}`,
        y: `+=${Math.sin(angle) * distance}`,
        opacity: 0,
        scale: 0.5,
        duration: 1 + Math.random() * duration,
        ease: 'power3.out'
      }, 0);
    });

    // Eliminar partículas al terminar
    tl.add(() => {
      particles.forEach(p => p.parentNode?.removeChild(p));
    });

    return tl;
  }
}
