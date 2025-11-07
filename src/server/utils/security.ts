'use strict';
/**
 * Security Utilities
 * HTML escaping, input validation, and security helpers
 */

/**
 * Escape HTML to prevent XSS attacks
 */
export function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email) && email.length >= 3 && email.length <= 254;
}

/**
 * Validate organization/team slug
 */
export function validateSlug(slug: string): boolean {
  return /^[a-z0-9-]{3,50}$/.test(slug);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): boolean {
  return password.length >= 12 && 
         /[A-Z]/.test(password) &&
         /[a-z]/.test(password) &&
         /[0-9]/.test(password);
}

/**
 * Validate string length
 */
export function validateLength(str: string, min: number, max: number): boolean {
  return str.length >= min && str.length <= max;
}

/**
 * Sanitize user input (basic)
 */
export function sanitizeInput(input: string, maxLength = 1000): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}

