'use client';

import { useEffect } from 'react';

export function ScrollRevealInit() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.transitionDelay = el.dataset.delay ?? '0ms';
            entry.target.classList.add('visible');
            // Unobserve after animating in to improve scrolling performance
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    // Selector covering all animation class variations
    const selectors = '.reveal, .reveal-fade, .reveal-scale, .reveal-stagger';

    // Helper to find and observe matching elements within a root node
    const observeElements = (root: ParentNode = document) => {
      const targets = root.querySelectorAll(selectors);
      targets.forEach((el) => {
        if (!el.classList.contains('visible')) {
          observer.observe(el);
        }
      });
      // Check if root itself matches
      if (root instanceof Element && root.matches(selectors) && !root.classList.contains('visible')) {
        observer.observe(root);
      }
    };

    // Run initial scan once mounted
    observeElements();

    // Set up a MutationObserver to watch for newly added DOM elements (routing & hydration)
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            observeElements(node as ParentNode);
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return null;
}
