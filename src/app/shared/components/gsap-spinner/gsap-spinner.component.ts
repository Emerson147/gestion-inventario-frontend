import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';

@Component({
  selector: 'app-gsap-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-overlay">
      <div class="spinner-container">
        <div class="spinner">
          <div #circle1 class="circle circle-1"></div>
          <div #circle2 class="circle circle-2"></div>
          <div #circle3 class="circle circle-3"></div>
        </div>
        <p class="message">{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .spinner-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }

    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .spinner {
      position: relative;
      width: 100px;
      height: 100px;
    }

    .circle {
      position: absolute;
      border-radius: 50%;
      background-color: var(--primary-color, #3B82F6);
      width: 20px;
      height: 20px;
      opacity: 0.7;
    }

    .message {
      margin-top: 20px;
      color: white;
      font-size: 1.2rem;
    }
  `]
})
export class GsapSpinnerComponent implements OnInit, OnDestroy {
  @ViewChild('circle1') circle1!: ElementRef;
  @ViewChild('circle2') circle2!: ElementRef;
  @ViewChild('circle3') circle3!: ElementRef;

  message = 'Cargando...';
  private timeline: gsap.core.Timeline | null = null;

  ngOnInit() {
    // Inicializamos después para asegurar que los ViewChild estén disponibles
    setTimeout(() => this.initAnimation(), 0);
  }

  ngOnDestroy() {
    // Limpiamos la animación al destruir el componente
    if (this.timeline) {
      this.timeline.kill();
    }
  }

  private initAnimation() {
    this.timeline = gsap.timeline({ repeat: -1 });

    // Posición inicial
    gsap.set(this.circle1.nativeElement, { x: 0, y: 0 });
    gsap.set(this.circle2.nativeElement, { x: 40, y: 0 });
    gsap.set(this.circle3.nativeElement, { x: 80, y: 0 });

    // Animación del primer círculo
    this.timeline.to(this.circle1.nativeElement, {
      duration: 2,
      y: 40,
      ease: "power1.inOut"
    })
      .to(this.circle1.nativeElement, {
        duration: 2,
        y: 0,
        ease: "power1.inOut"
      });

    // Animación del segundo círculo (con delay)
    this.timeline.to(this.circle2.nativeElement, {
      duration: 2,
      y: 40,
      ease: "power1.inOut"
    }, "-=0.6")
      .to(this.circle2.nativeElement, {
        duration: 0.8,
        y: 0,
        ease: "power1.inOut"
      }, "-=0.6");

    // Animación del tercer círculo (con delay)
    this.timeline.to(this.circle3.nativeElement, {
      duration: 2,
      y: 40,
      ease: "power1.inOut"
    }, "-=0.6")
      .to(this.circle3.nativeElement, {
        duration: 0.8,
        y: 0,
        ease: "power1.inOut"
      }, "-=0.6");
  }
}
