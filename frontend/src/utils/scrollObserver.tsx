import { onCleanup } from "solid-js";

/**
 * SolidJS Directive for animating elements when they scroll into view.
 * Usage: <div use:reveal={{ delay: 100 }} class="opacity-0">...</div>
 */
export function reveal(el: HTMLElement, accessor: () => any) {
  const options = accessor() || {};
  const delay = options.delay || 0;
  
  // Set initial state
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        observer.unobserve(el);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });
  
  observer.observe(el);
  
  onCleanup(() => observer.disconnect());
}

// Ensure TypeScript recognizes the directive
declare module "solid-js" {
  namespace JSX {
    interface Directives {
      reveal: any;
    }
  }
}
