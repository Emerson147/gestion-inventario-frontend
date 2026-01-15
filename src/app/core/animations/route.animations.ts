import {
  trigger,
  transition,
  style,
  animate,
  query,
  group,
} from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
  // Transición de Login a Register (blur + fade + sutil slide)
  transition('login => register', [
    style({ position: 'relative', overflow: 'hidden' }),
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }),
      ],
      { optional: true }
    ),
    query(
      ':enter',
      [
        style({
          opacity: 0,
          filter: 'blur(8px)',
          transform: 'translateX(30px) scale(0.98)',
        }),
      ],
      { optional: true }
    ),
    group([
      query(
        ':leave',
        [
          animate(
            '350ms cubic-bezier(0.4, 0, 0.2, 1)',
            style({
              opacity: 0,
              filter: 'blur(8px)',
              transform: 'translateX(-30px) scale(0.98)',
            })
          ),
        ],
        { optional: true }
      ),
      query(
        ':enter',
        [
          animate(
            '450ms 100ms cubic-bezier(0.4, 0, 0.2, 1)',
            style({
              opacity: 1,
              filter: 'blur(0px)',
              transform: 'translateX(0) scale(1)',
            })
          ),
        ],
        { optional: true }
      ),
    ]),
  ]),

  // Transición de Register a Login (blur + fade + sutil slide)
  transition('register => login', [
    style({ position: 'relative', overflow: 'hidden' }),
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }),
      ],
      { optional: true }
    ),
    query(
      ':enter',
      [
        style({
          opacity: 0,
          filter: 'blur(8px)',
          transform: 'translateX(-30px) scale(0.98)',
        }),
      ],
      { optional: true }
    ),
    group([
      query(
        ':leave',
        [
          animate(
            '350ms cubic-bezier(0.4, 0, 0.2, 1)',
            style({
              opacity: 0,
              filter: 'blur(8px)',
              transform: 'translateX(30px) scale(0.98)',
            })
          ),
        ],
        { optional: true }
      ),
      query(
        ':enter',
        [
          animate(
            '450ms 100ms cubic-bezier(0.4, 0, 0.2, 1)',
            style({
              opacity: 1,
              filter: 'blur(0px)',
              transform: 'translateX(0) scale(1)',
            })
          ),
        ],
        { optional: true }
      ),
    ]),
  ]),

  // Transición por defecto (blur suave)
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }),
      ],
      { optional: true }
    ),
    query(':enter', [style({ opacity: 0, filter: 'blur(4px)' })], {
      optional: true,
    }),
    group([
      query(
        ':leave',
        [animate('300ms ease-out', style({ opacity: 0, filter: 'blur(4px)' }))],
        {
          optional: true,
        }
      ),
      query(
        ':enter',
        [
          animate(
            '400ms 50ms ease-out',
            style({ opacity: 1, filter: 'blur(0px)' })
          ),
        ],
        {
          optional: true,
        }
      ),
    ]),
  ]),
]);
