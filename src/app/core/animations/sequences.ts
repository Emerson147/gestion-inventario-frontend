// src/app/animations/sequences.ts
import { gsap } from 'gsap';

export const createLoginAnimation = (elements: {
  container?: HTMLElement,
  card?: HTMLElement,
  logo?: HTMLElement,
  texts?: HTMLElement[],
  formFields?: HTMLElement[],
  links?: HTMLElement[] | Element[] | HTMLCollection,
  button?: HTMLElement
}) => {
  // Comprobamos que todos los elementos existan
  if (!elements.container || !elements.card || !elements.logo ||
      !elements.texts || !elements.formFields || !elements.links || !elements.button) {
    console.warn('Algunos elementos para la animación no están disponibles todavía');
    return null;
  }

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  // Fondo
  tl.from(elements.container, {
    opacity: 0,
    duration: 1
  });

  // Contenedor de la tarjeta
  tl.from(elements.card, {
    opacity: 0,
    scale: 0.9,
    duration: 0.7
  }, "-=0.5");

  // Logo
  tl.from(elements.logo, {
    opacity: 0,
    y: -20,
    duration: 0.6
  }, "-=0.3");

  // Textos
  tl.from(elements.texts, {
    opacity: 0,
    y: 20,
    stagger: 0.2,
    duration: 0.5
  }, "-=0.2");

  // Campos del formulario
  tl.from(elements.formFields, {
    opacity: 0,
    x: -30,
    stagger: 0.2,
    duration: 0.6
  }, "-=0.1");

  // Enlaces
  tl.from(elements.links, {
    opacity: 0,
    y: 10,
    stagger: 0.1,
    duration: 0.4
  }, "-=0.2");

  // Botón
  tl.from(elements.button, {
    opacity: 0,
    scale: 0.8,
    duration: 0.5
  }, "-=0.1");

  return tl;
};
