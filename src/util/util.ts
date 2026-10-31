import { type ClassNameValue, extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    },
  },
});

/**
 * Tailwind classnames merger
 * @param classNames Classnames
 * @return Merged classnames
 */
export const clx = (...classNames: ClassNameValue[]) => twMerge(...classNames);

/**
 * Sleep
 * @param ms Time to sleep in milliseconds
 */
export const sleep = (ms = 1000) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
