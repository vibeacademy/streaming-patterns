/**
 * React Hooks Module
 *
 * Exports all custom React hooks for the streaming patterns library.
 *
 * @module lib/hooks
 */

export { useNetworkCapture } from './useNetworkCapture';
export type {
  CapturedEvent,
  EventFilter,
  NetworkCaptureResult,
} from './useNetworkCapture';

export { useStreamProcessor } from './useStreamProcessor';
export type {
  UseStreamProcessorOptions,
  UseStreamProcessorResult,
} from './useStreamProcessor';
