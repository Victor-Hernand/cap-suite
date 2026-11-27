export const TOAST_ENTERING_CLASS = 'cap-toast--entering';
export const TOAST_LEAVING_CLASS = 'cap-toast--leaving';
export const TOAST_MOVING_CLASS = 'cap-toast--moving';

/**
 * Pone `className` y llama a `done` cuando termina (o se cancela) la animación `animationName`.
 * Sin esa animación (CSS sin cargar, entorno de pruebas) llama a `done` al instante. Busca por
 * nombre porque la barra de progreso también anima dentro del mismo elemento.
 */
function runAnimation(element, className, animationName, done) {
  element.classList.add(className);
  const animation = element.getAnimations?.().find((candidate) => candidate.animationName === animationName);
  if (!animation) {
    done();
    return;
  }
  animation.finished.catch(() => {}).then(done);
}

export function playEnter(element) {
  runAnimation(element, TOAST_ENTERING_CLASS, 'cap-toast-in', () => element.classList.remove(TOAST_ENTERING_CLASS));
}

export function playExit(element, done) {
  element.classList.remove(TOAST_ENTERING_CLASS, TOAST_MOVING_CLASS);
  runAnimation(element, TOAST_LEAVING_CLASS, 'cap-toast-out', done);
}

/**
 * Saca los toasts del flujo sin moverlos de donde se ven, para que los demás se deslicen a su hueco
 * mientras salen. Mide todos antes de fijar ninguno (fijar uno mueve a los demás) y fija contra el
 * borde superior del toaster después de fijarlos, porque en escritorio está anclado abajo y ese
 * borde baja al encogerse.
 */
export function pinInPlace(...elements) {
  if (!elements.length) return;
  const boxes = elements.map((element) => ({
    screenTop: element.getBoundingClientRect().top,
    left: element.offsetLeft,
    width: element.offsetWidth,
  }));
  elements.forEach((element, index) => {
    Object.assign(element.style, {
      position: 'absolute',
      left: `${boxes[index].left}px`,
      width: `${boxes[index].width}px`,
    });
  });
  const toasterTop = elements[0].parentElement.getBoundingClientRect().top;
  elements.forEach((element, index) => {
    element.style.top = `${boxes[index].screenTop - toasterTop}px`;
  });
}

export function captureTops(elements) {
  return new Map(elements.map((element) => [element, element.getBoundingClientRect().top]));
}

/**
 * FLIP, como el `move` de TransitionGroup en Vue: cada toast que cambió de altura arranca donde
 * estaba, sin transición, y se desliza a su lugar nuevo. Lee todas las posiciones antes de escribir
 * para forzar un solo reflow.
 */
export function slideFromPreviousTops(previousTops) {
  const shifts = [...previousTops]
    .map(([element, previousTop]) => ({ element, shift: previousTop - element.getBoundingClientRect().top }))
    .filter(({ shift }) => shift);
  if (!shifts.length) return;
  for (const { element, shift } of shifts) {
    element.style.transitionDuration = '0s';
    element.style.transform = `translateY(${shift}px)`;
  }
  shifts[0].element.getBoundingClientRect();
  for (const { element } of shifts) {
    element.classList.add(TOAST_MOVING_CLASS);
    element.style.transitionDuration = '';
    element.style.transform = '';
    const settle = (event) => {
      if (event.target !== element || event.propertyName !== 'transform') return;
      element.removeEventListener('transitionend', settle);
      element.classList.remove(TOAST_MOVING_CLASS);
    };
    element.addEventListener('transitionend', settle);
  }
}
