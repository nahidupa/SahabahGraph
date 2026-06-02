// Test setup file for mocking browser APIs not available in jsdom
import '@testing-library/jest-dom/vitest';

// Mock scrollIntoView
Element.prototype.scrollIntoView = () => {};

// Mock HTMLElement.prototype methods if needed
if (typeof HTMLElement !== 'undefined') {
  HTMLElement.prototype.scrollIntoView = () => {};
}
