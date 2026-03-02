/**
 * Form Validation Helpers
 * Client-side validation matching server requirements
 */

import { VALIDATION } from './constants';

/**
 * Validation error type
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // Check length
  if (email.length > VALIDATION.EMAIL.MAX_LENGTH) {
    return false;
  }
  
  // Check pattern
  return VALIDATION.EMAIL.PATTERN.test(email.trim());
}

/**
 * Get email validation error message
 */
export function validateEmail(email: string): string | null {
  if (!email || email.trim().length === 0) {
    return 'Email is required';
  }
  
  if (email.length > VALIDATION.EMAIL.MAX_LENGTH) {
    return `Email must be less than ${VALIDATION.EMAIL.MAX_LENGTH} characters`;
  }
  
  if (!VALIDATION.EMAIL.PATTERN.test(email.trim())) {
    return 'Please enter a valid email address';
  }
  
  return null;
}

/**
 * Validate password meets requirements
 */
export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }
  
  // Check length
  if (password.length < VALIDATION.PASSWORD.MIN_LENGTH ||
      password.length > VALIDATION.PASSWORD.MAX_LENGTH) {
    return false;
  }
  
  // Check pattern (at least one uppercase, one lowercase, one number)
  return VALIDATION.PASSWORD.PATTERN.test(password);
}

/**
 * Get password validation error message
 */
export function validatePassword(password: string): string | null {
  if (!password || password.length === 0) {
    return 'Password is required';
  }
  
  if (password.length < VALIDATION.PASSWORD.MIN_LENGTH) {
    return `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`;
  }
  
  if (password.length > VALIDATION.PASSWORD.MAX_LENGTH) {
    return `Password must be less than ${VALIDATION.PASSWORD.MAX_LENGTH} characters`;
  }
  
  if (!VALIDATION.PASSWORD.PATTERN.test(password)) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
  }
  
  return null;
}

/**
 * Validate name (first name, last name)
 */
export function isValidName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }
  
  const trimmed = name.trim();
  
  // Check length
  if (trimmed.length < VALIDATION.NAME.MIN_LENGTH ||
      trimmed.length > VALIDATION.NAME.MAX_LENGTH) {
    return false;
  }
  
  // Check pattern (letters, spaces, hyphens, apostrophes)
  return VALIDATION.NAME.PATTERN.test(trimmed);
}

/**
 * Get name validation error message
 */
export function validateName(name: string, fieldName: string = 'Name'): string | null {
  if (!name || name.trim().length === 0) {
    return `${fieldName} is required`;
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < VALIDATION.NAME.MIN_LENGTH) {
    return `${fieldName} must be at least ${VALIDATION.NAME.MIN_LENGTH} characters`;
  }
  
  if (trimmed.length > VALIDATION.NAME.MAX_LENGTH) {
    return `${fieldName} must be less than ${VALIDATION.NAME.MAX_LENGTH} characters`;
  }
  
  if (!VALIDATION.NAME.PATTERN.test(trimmed)) {
    return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
  }
  
  return null;
}

/**
 * Validate login form
 */
export function validateLogin(email: string, password: string): ValidationResult {
  const errors: Record<string, string> = {};
  
  const emailError = validateEmail(email);
  if (emailError) {
    errors.email = emailError;
  }
  
  if (!password || password.length === 0) {
    errors.password = 'Password is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate registration form
 */
export function validateRegistration(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  userType: string
): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Email validation
  const emailError = validateEmail(email);
  if (emailError) {
    errors.email = emailError;
  }
  
  // Password validation
  const passwordError = validatePassword(password);
  if (passwordError) {
    errors.password = passwordError;
  }
  
  // First name validation
  const firstNameError = validateName(firstName, 'First name');
  if (firstNameError) {
    errors.firstName = firstNameError;
  }
  
  // Last name validation
  const lastNameError = validateName(lastName, 'Last name');
  if (lastNameError) {
    errors.lastName = lastNameError;
  }
  
  // User type validation
  if (!userType || (userType !== 'job_seeker' && userType !== 'employer')) {
    errors.userType = 'Please select a user type';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Sanitize input (trim and remove extra spaces)
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input.trim().replace(/\s+/g, ' ');
}
