/**
 * Event listeners initialization
 * Import all event listeners here to register them
 * 
 * Listeners are organized by concern (Single Responsibility Principle):
 * - notifications/: Email, SMS, push notifications
 * - security/: Security monitoring, anomaly detection, brute force protection
 * - audit/: Audit logging (TODO)
 * 
 * Each concern directory organizes listeners by domain (auth, job, application, etc.)
 */

import './notifications/index.js';
import './security/index.js';

// TODO: Add more listener concerns as needed
// import './audit/index.js';

export {};
