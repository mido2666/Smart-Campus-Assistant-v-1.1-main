import '@testing-library/jest-dom';
import 'whatwg-fetch';

const origError = console.error;
console.error = (...args: any[]) => {
  if (args && args.length > 0 && typeof args[0] === 'string' && /(act\(|Warning:)/.test(args[0])) return;
  // @ts-ignore - preserve original signature
  origError(...args);
};


