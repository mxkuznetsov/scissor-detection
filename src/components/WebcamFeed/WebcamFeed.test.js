import { render, screen, fireEvent } from '@testing-library/react';
import WebcamFeed from './WebcamFeed';

jest.mock('../Video/Video', () => {
  return function MockVideoDisplay({ hasScissorsDetected }) {
    return (
      <div data-testid="video-display" className={hasScissorsDetected ? 'scissors-detected' : ''}>
        Mock Video Display
      </div>
    );
  };
});

const mockDetectPersons = jest.fn();
const mockUsePersonDetection = {
  detectedPersons: [],
  modelLoaded: true,
  error: null,
  detectPersons: mockDetectPersons
};

jest.mock('../../__hooks__/usePersonDetection', () => ({
  usePersonDetection: () => mockUsePersonDetection
}));

const mockGetUserMedia = jest.fn();
Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: { getUserMedia: mockGetUserMedia }
});

Object.defineProperty(HTMLVideoElement.prototype, 'addEventListener', {
  writable: true,
  value: jest.fn((event, callback) => {
    if (event === 'loadedmetadata') {
      setTimeout(callback, 0);
    }
  })
});

Object.defineProperty(HTMLVideoElement.prototype, 'removeEventListener', {
  writable: true,
  value: jest.fn()
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  writable: true,
  value: jest.fn(() => ({
    drawImage: jest.fn()
  }))
});

Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  writable: true,
  value: jest.fn(() => 'data:image/png;base64,mockimage')
});

describe('WebcamFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserMedia.mockResolvedValue({ srcObject: 'mock-stream' });
    mockUsePersonDetection.detectedPersons = [];
    mockUsePersonDetection.error = null;
  });

  it('renders video display', () => {
    render(<WebcamFeed />);
    expect(screen.getByTestId('video-display')).toBeInTheDocument();
  });

  it('shows error message when camera fails', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Camera denied'));
    
    render(<WebcamFeed />);
    
    await screen.findByText(/An unexpected error occurred/);
    expect(screen.getByText('Retry camera')).toBeInTheDocument();
  });

  it('shows retry button on error and retries when clicked', async () => {
    mockGetUserMedia
      .mockRejectedValueOnce(new Error('Camera denied'))
      .mockResolvedValueOnce({ srcObject: 'mock-stream' });
    
    render(<WebcamFeed />);
    
    const retryButton = await screen.findByText('Retry camera');
    fireEvent.click(retryButton);
    
    expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
  });

  it('calls onImageCapture when scissors detected', () => {
    const mockOnImageCapture = jest.fn();
    mockUsePersonDetection.detectedPersons = [
      { className: 'scissors', bbox: [0, 0, 50, 50], confidence: 0.9, timestamp: new Date() }
    ];
    
    render(<WebcamFeed onImageCapture={mockOnImageCapture} />);
    
    setTimeout(() => {
      expect(mockOnImageCapture).toHaveBeenCalledWith('data:image/png;base64,mockimage');
    }, 0);
  });

  it('shows scissors alert when scissors detected', () => {
    mockUsePersonDetection.detectedPersons = [
      { className: 'scissors', bbox: [0, 0, 50, 50], confidence: 0.9, timestamp: new Date() }
    ];
    
    render(<WebcamFeed />);
    
    expect(screen.getByText(/Scissors on the loose/)).toBeInTheDocument();
  });

  it('passes scissors detection to video display', () => {
    mockUsePersonDetection.detectedPersons = [
      { className: 'scissors', bbox: [0, 0, 50, 50], confidence: 0.9, timestamp: new Date() }
    ];
    
    render(<WebcamFeed />);
    
    const videoDisplay = screen.getByTestId('video-display');
    expect(videoDisplay).toHaveClass('scissors-detected');
  });

  it('shows AI model error', () => {
    mockUsePersonDetection.error = 'Model failed to load';
    
    render(<WebcamFeed />);
    
    expect(screen.getByText(/AI Model Error: Model failed to load/)).toBeInTheDocument();
  });
});