import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

jest.mock('./components/WebcamFeed/WebcamFeed', () => {
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

describe('App', () => {
  it('renders title and webcam feed', () => {
    render(<App />);
    expect(screen.getByText('Are you running with scissors?')).toBeInTheDocument();
    expect(screen.getByTestId('webcam-feed')).toBeInTheDocument();
  });

  it('shows gallery after image capture', () => {
    render(<App />);
    
    expect(screen.queryByText('Destroy the evidence')).not.toBeInTheDocument();
    
    fireEvent.click(screen.getByTestId('mock-capture'));
    
    expect(screen.getByText('Destroy the evidence')).toBeInTheDocument();
    expect(screen.getByText('Evidence #1')).toBeInTheDocument();
  });

  it('handles multiple images and gallery clearing', () => {
    render(<App />);
    
    const captureButton = screen.getByTestId('mock-capture');
    
    fireEvent.click(captureButton);
    fireEvent.click(captureButton);
    fireEvent.click(captureButton);
    
    expect(screen.getByText('Evidence #3')).toBeInTheDocument();
    expect(screen.getAllByAltText('""')).toHaveLength(3);
     
    fireEvent.click(screen.getByText('Destroy the evidence'));
    
    expect(screen.queryByText('Destroy the evidence')).not.toBeInTheDocument();
  });
});
