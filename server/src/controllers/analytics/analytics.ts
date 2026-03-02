/**
 * Analytics Controller
 * Receives analytics events from client, validates, enriches, and publishes to event bus
 */

import { Request, Response } from 'express';
import logger from '../../utils/logger.js';
import { eventBus, DomainEvent } from '../../events/eventBus.js';
import type {
  ClientAnalyticsEvent,
  AnalyticsBatchRequest,
  EnrichedAnalyticsEvent,
} from '../../types/analytics.js';
import { 
  analyticsEventstotal, 
  clientErrorsTotal, 
  webVitalsMetric 
} from '../../config/metrics.js';

/**
 * Track a single analytics event
 */
export async function trackEvent(req: Request, res: Response): Promise<void> {
  try {
    const event: ClientAnalyticsEvent = req.body;
    
    // Validate event
    if (!event.eventName || typeof event.eventName !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Invalid event: eventName is required',
      });
      return;
    }
    
    // Enrich event with server-side data
    const enrichedEvent: EnrichedAnalyticsEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      userId: req.user?.id,
      userType: req.user?.userType,
      ipAddress: req.ip || req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer,
      correlationId: req.requestId,
    };
    
    // Log to structured logs (Loki will pick this up)
    logger.info('[Analytics] Event tracked', {
      event: enrichedEvent.eventName,
      userId: enrichedEvent.userId,
      sessionId: enrichedEvent.sessionId,
      properties: enrichedEvent.properties,
      correlationId: enrichedEvent.correlationId,
    });
    
    // Increment Prometheus counter
    analyticsEventstotal
      .labels(enrichedEvent.eventName, enrichedEvent.userType || 'anonymous')
      .inc();
    
    // Emit to event bus for async processing
    eventBus.emit('analytics.event_tracked', enrichedEvent);
    
    res.status(202).json({
      success: true,
      message: 'Event tracked',
    });
  } catch (error) {
    logger.error('[Analytics] Error tracking event:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to track event',
    });
  }
}

/**
 * Track multiple analytics events in batch
 * More efficient for client - sends multiple events at once
 */
export async function trackBatchEvents(req: Request, res: Response): Promise<void> {
  try {
    const batch: AnalyticsBatchRequest = req.body;
    
    // Validate batch
    if (!batch.events || !Array.isArray(batch.events) || batch.events.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid batch: events array is required',
      });
      return;
    }
    
    // Limit batch size to prevent abuse
    const MAX_BATCH_SIZE = 50;
    if (batch.events.length > MAX_BATCH_SIZE) {
      res.status(400).json({
        success: false,
        message: `Batch too large: maximum ${MAX_BATCH_SIZE} events`,
      });
      return;
    }
    
    // Process each event
    const enrichedEvents: EnrichedAnalyticsEvent[] = [];
    const timestamp = new Date().toISOString();
    
    for (const event of batch.events) {
      // Skip invalid events
      if (!event.eventName || typeof event.eventName !== 'string') {
        logger.warn('[Analytics] Skipping invalid event in batch', { event });
        continue;
      }
      
      // Enrich event
      const enrichedEvent: EnrichedAnalyticsEvent = {
        ...event,
        sessionId: event.sessionId || batch.sessionId,
        timestamp,
        userId: req.user?.id,
        userType: req.user?.userType,
        ipAddress: req.ip || req.headers['x-forwarded-for'] as string,
        userAgent: req.headers['user-agent'],
        referrer: req.headers.referer,
        correlationId: req.requestId,
      };
      
      enrichedEvents.push(enrichedEvent);
      
      // Increment Prometheus counter
      analyticsEventstotal
        .labels(enrichedEvent.eventName, enrichedEvent.userType || 'anonymous')
        .inc();
    }
    
    // Log batch
    logger.info('[Analytics] Batch tracked', {
      count: enrichedEvents.length,
      userId: req.user?.id,
      sessionId: batch.sessionId,
      correlationId: req.requestId,
    });
    
    // Emit to event bus for async processing
    eventBus.emit('analytics.batch_tracked', {
      events: enrichedEvents,
      count: enrichedEvents.length,
      userId: req.user?.id,
    });
    
    res.status(202).json({
      success: true,
      message: 'Batch tracked',
      count: enrichedEvents.length,
    });
  } catch (error) {
    logger.error('[Analytics] Error tracking batch:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to track batch',
    });
  }
}

/**
 * Track performance metrics (Web Vitals)
 */
export async function trackPerformance(req: Request, res: Response): Promise<void> {
  try {
    const { metric, value, rating, delta, id, navigationType } = req.body;
    
    // Validate
    if (!metric || !value) {
      res.status(400).json({
        success: false,
        message: 'Invalid performance metric',
      });
      return;
    }
    
    // Log performance metric
    logger.info('[Analytics] Performance metric', {
      metric,
      value,
      rating,
      delta,
      id,
      navigationType,
      userId: req.user?.id,
      userAgent: req.headers['user-agent'],
      correlationId: req.requestId,
    });
    
    // Record in Prometheus histogram
    webVitalsMetric
      .labels(metric, req.body.page || 'unknown')
      .observe(value / 1000); // Convert to seconds
    
    res.status(202).json({
      success: true,
      message: 'Performance metric tracked',
    });
  } catch (error) {
    logger.error('[Analytics] Error tracking performance:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to track performance',
    });
  }
}

/**
 * Track client-side errors
 */
export async function trackError(req: Request, res: Response): Promise<void> {
  try {
    const { error, errorInfo, componentStack } = req.body;
    
    // Log error
    logger.error('[Analytics] Client error', {
      error: error?.message || error,
      stack: error?.stack,
      errorInfo,
      componentStack,
      userId: req.user?.id,
      url: req.headers.referer,
      userAgent: req.headers['user-agent'],
      correlationId: req.requestId,
    });
    
    // Increment error counter
    clientErrorsTotal
      .labels(error?.name || 'unknown', req.body.page || 'unknown')
      .inc();
    
    res.status(202).json({
      success: true,
      message: 'Error tracked',
    });
  } catch (error) {
    logger.error('[Analytics] Error tracking client error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to track error',
    });
  }
}
