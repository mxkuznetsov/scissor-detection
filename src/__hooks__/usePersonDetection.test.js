import { renderHook, act, waitFor } from '@testing-library/react';
import * as tf from '@tensorflow/tfjs';
import { usePersonDetection } from './usePersonDetection';

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs', () => ({
  setBackend: jest.fn(),
  ready: jest.fn(),
  loadGraphModel: jest.fn(),
  zeros: jest.fn(() => ({
    dispose: jest.fn()
  })),
  tidy: jest.fn((fn) => fn()),
  browser: {
    fromPixels: jest.fn(() => ({
      div: jest.fn(() => ({
        cast: jest.fn(() => ({
          expandDims: jest.fn(() => 'mockTensor')
        }))
      }))
    }))
  },
  image: {
    resizeBilinear: jest.fn(() => ({
      div: jest.fn(() => ({
        cast: jest.fn(() => ({
          expandDims: jest.fn(() => 'mockTensor')
        }))
      }))
    }))
  }
}));

// Mock video element
const createMockVideo = (width = 640, height = 480) => ({
  videoWidth: width,
  videoHeight: height,
  tagName: 'VIDEO'
});

// Mock model with predict method
const createMockModel = () => ({
  predict: jest.fn(() => ({
    squeeze: jest.fn(() => ({
      transpose: jest.fn(() => ({
        dataSync: jest.fn(() => new Float32Array(8400 * 84).fill(0.1)),
        shape: [8400, 84],
        dispose: jest.fn()
      })),
      dispose: jest.fn()
    })),
    dispose: jest.fn()
  })),
  dispose: jest.fn()
});

describe('usePersonDetection Hook', () => {
  let mockModel;
  let consoleSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    mockModel = createMockModel();
    
    // Mock console methods to avoid test noise
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Setup TensorFlow mocks
    tf.setBackend.mockResolvedValue(undefined);
    tf.ready.mockResolvedValue(undefined);
    tf.loadGraphModel.mockResolvedValue(mockModel);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const { result } = renderHook(() => usePersonDetection());

      expect(result.current.detectedPersons).toEqual([]);
      expect(result.current.isDetecting).toBe(false);
      expect(result.current.modelLoaded).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Model Loading', () => {
    it('loads model successfully on mount', async () => {
      const { result } = renderHook(() => usePersonDetection());

      await waitFor(() => {
        expect(result.current.modelLoaded).toBe(true);
      });

      expect(tf.setBackend).toHaveBeenCalledWith('webgl');
      expect(tf.ready).toHaveBeenCalled();
      expect(tf.loadGraphModel).toHaveBeenCalled();
      expect(result.current.error).toBeNull();
    });

    it('handles model loading errors', async () => {
      const error = new Error('Failed to load model');
      tf.loadGraphModel.mockRejectedValue(error);

      const { result } = renderHook(() => usePersonDetection());

      await waitFor(() => {
        expect(result.current.error).toContain('Failed to load YOLOv8 model');
      });

      expect(result.current.modelLoaded).toBe(false);
    });

    it('handles backend setup errors', async () => {
      const error = new Error('WebGL not supported');
      tf.setBackend.mockRejectedValue(error);

      const { result } = renderHook(() => usePersonDetection());

      await waitFor(() => {
        expect(result.current.error).toContain('Failed to load YOLOv8 model');
      });
    });
  });

  describe('Person Detection', () => {
    it('detects persons when model is loaded', async () => {
      const { result } = renderHook(() => usePersonDetection());

      // Wait for model to load
      await waitFor(() => {
        expect(result.current.modelLoaded).toBe(true);
      });

      const mockVideo = createMockVideo();

      await act(async () => {
        await result.current.detectPersons(mockVideo);
      });

      expect(result.current.isDetecting).toBe(false);
      expect(mockModel.predict).toHaveBeenCalled();
    });

    it('does not detect when model is not loaded', async () => {
      tf.loadGraphModel.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => usePersonDetection());
      const mockVideo = createMockVideo();

      await act(async () => {
        await result.current.detectPersons(mockVideo);
      });

      expect(mockModel.predict).not.toHaveBeenCalled();
      expect(result.current.isDetecting).toBe(false);
    });

    it('handles detection errors gracefully', async () => {
      const { result } = renderHook(() => usePersonDetection());

      await waitFor(() => {
        expect(result.current.modelLoaded).toBe(true);
      });

      const error = new Error('Detection failed');
      mockModel.predict.mockImplementation(() => {
        throw error;
      });

      const mockVideo = createMockVideo();

      await act(async () => {
        await result.current.detectPersons(mockVideo);
      });

      expect(result.current.error).toContain('Detection failed');
      expect(result.current.isDetecting).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('cleans up model on unmount', async () => {
      const { result, unmount } = renderHook(() => usePersonDetection());

      await waitFor(() => {
        expect(result.current.modelLoaded).toBe(true);
      });

      unmount();

      expect(mockModel.dispose).toHaveBeenCalled();
    });

    it('can manually cleanup model', async () => {
      const { result } = renderHook(() => usePersonDetection());

      await waitFor(() => {
        expect(result.current.modelLoaded).toBe(true);
      });

      act(() => {
        result.current.cleanup();
      });

      expect(mockModel.dispose).toHaveBeenCalled();
      expect(result.current.modelLoaded).toBe(false);
      expect(result.current.detectedPersons).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('handles video with different dimensions', async () => {
      const { result } = renderHook(() => usePersonDetection());

      await waitFor(() => {
        expect(result.current.modelLoaded).toBe(true);
      });

      const mockVideo = createMockVideo(1280, 720);

      await act(async () => {
        await result.current.detectPersons(mockVideo);
      });

      expect(mockModel.predict).toHaveBeenCalled();
    });

    it('handles empty detection results', async () => {
      const { result } = renderHook(() => usePersonDetection());

      await waitFor(() => {
        expect(result.current.modelLoaded).toBe(true);
      });

      // Mock empty results (all confidence scores below threshold)
      mockModel.predict.mockReturnValue({
        squeeze: jest.fn(() => ({
          transpose: jest.fn(() => ({
            dataSync: jest.fn(() => new Float32Array(8400 * 84).fill(0.01)), // Low confidence
            shape: [8400, 84],
            dispose: jest.fn()
          })),
          dispose: jest.fn()
        })),
        dispose: jest.fn()
      });

      const mockVideo = createMockVideo();

      await act(async () => {
        await result.current.detectPersons(mockVideo);
      });

      expect(result.current.detectedPersons).toEqual([]);
    });

    it('can reinitialize model after error', async () => {
      // First load fails
      const error = new Error('Initial load failed');
      tf.loadGraphModel.mockRejectedValueOnce(error);

      const { result } = renderHook(() => usePersonDetection());

      await waitFor(() => {
        expect(result.current.error).toContain('Failed to load YOLOv8 model');
      });

      // Then succeeds on retry
      tf.loadGraphModel.mockResolvedValue(mockModel);

      await act(async () => {
        await result.current.initializeModel();
      });

      expect(result.current.modelLoaded).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });
});