import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock the WebcamFeed component since it has complex dependencies
jest.mock('./WebcamFeed', () => {
  return function MockWebcamFeed({ onImageCapture }) {
    return (
      <div data-testid="webcam-feed">
        <button 
          onClick={() => onImageCapture('data:image/png;base64,mockimage1')}
          data-testid="mock-capture"
        >
          Mock Capture
        </button>
      </div>
    );
  };
});

describe('App Component', () => {
  beforeEach(() => {
    // Clear any mocks before each test
    jest.clearAllMocks();
  });

  it('renders the main title', () => {
    render(<App />);
    expect(screen.getByText('Are you running with scissors?')).toBeInTheDocument();
  });

  it('renders the WebcamFeed component', () => {
    render(<App />);
    expect(screen.getByTestId('webcam-feed')).toBeInTheDocument();
  });

  it('does not show gallery when no images are captured', () => {
    render(<App />);
    expect(screen.queryByText('Destroy the evidence')).not.toBeInTheDocument();
    expect(screen.queryByText('Evidence #1')).not.toBeInTheDocument();
  });

  it('shows gallery when images are captured', () => {
    render(<App />);
    
    // Simulate image capture
    const captureButton = screen.getByTestId('mock-capture');
    fireEvent.click(captureButton);
    
    expect(screen.getByText('Destroy the evidence')).toBeInTheDocument();
    expect(screen.getByText('Evidence #1')).toBeInTheDocument();
  });

  it('displays multiple captured images with correct labels', () => {
    render(<App />);
    
    const captureButton = screen.getByTestId('mock-capture');
    
    // Capture multiple images
    fireEvent.click(captureButton);
    fireEvent.click(captureButton);
    fireEvent.click(captureButton);
    
    expect(screen.getByText('Evidence #1')).toBeInTheDocument();
    expect(screen.getByText('Evidence #2')).toBeInTheDocument();
    expect(screen.getByText('Evidence #3')).toBeInTheDocument();
    
    // Check that all images are rendered
    const images = screen.getAllByAltText('""');
    expect(images).toHaveLength(3);
  });

  it('clears gallery when destroy evidence button is clicked', () => {
    render(<App />);
    
    const captureButton = screen.getByTestId('mock-capture');
    
    // Capture some images
    fireEvent.click(captureButton);
    fireEvent.click(captureButton);
    
    expect(screen.getByText('Evidence #1')).toBeInTheDocument();
    expect(screen.getByText('Evidence #2')).toBeInTheDocument();
    
    // Clear the gallery
    const destroyButton = screen.getByText('Destroy the evidence');
    fireEvent.click(destroyButton);
    
    // Gallery should be hidden again
    expect(screen.queryByText('Destroy the evidence')).not.toBeInTheDocument();
    expect(screen.queryByText('Evidence #1')).not.toBeInTheDocument();
  });

  it('has correct CSS classes applied', () => {
    render(<App />);
    
    const appContainer = screen.getByText('Are you running with scissors?').closest('.app-container');
    expect(appContainer).toBeInTheDocument();
    
    const appContent = screen.getByText('Are you running with scissors?').closest('.app-content');
    expect(appContent).toBeInTheDocument();
  });

  it('passes onImageCapture callback to WebcamFeed', () => {
    render(<App />);
    
    const captureButton = screen.getByTestId('mock-capture');
    
    // This test implicitly verifies the callback works since we can capture images
    expect(captureButton).toBeInTheDocument();
    
    fireEvent.click(captureButton);
    expect(screen.getByText('Evidence #1')).toBeInTheDocument();
  });

  it('handles empty image data gracefully', () => {
    const MockWebcamFeedWithEmptyData = ({ onImageCapture }) => (
      <div data-testid="webcam-feed">
        <button 
          onClick={() => onImageCapture('')}
          data-testid="mock-capture-empty"
        >
          Mock Empty Capture
        </button>
      </div>
    );

    jest.doMock('./WebcamFeed', () => MockWebcamFeedWithEmptyData);
    
    render(<App />);
    
    const captureButton = screen.getByTestId('mock-capture-empty');
    fireEvent.click(captureButton);
    
    // Should still create an entry even with empty data
    expect(screen.getByText('Evidence #1')).toBeInTheDocument();
  });
});
