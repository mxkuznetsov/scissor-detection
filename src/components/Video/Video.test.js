import { render, screen } from '@testing-library/react';
import Video from './Video';

const defaultProps = {
  videoRef: { current: null },
  isStreaming: false,
  isLoading: false,
  detectedPersons: [],
  capturedImage: null,
  hasScissorsDetected: false
};

describe('Video', () => {
  it('renders video element', () => {
    render(<Video {...defaultProps} />);
    
    const video = screen.getByRole('application');
    expect(video).toHaveClass('video-element');
  });

  it('shows loading status', () => {
    render(<Video {...defaultProps} isLoading={true} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Starting camera...')).toBeInTheDocument();
  });

  it('shows video when streaming', () => {
    render(<Video {...defaultProps} isStreaming={true} />);
    
    const video = screen.getByRole('application');
    expect(video).toHaveStyle({ display: 'block' });
  });

  it('hides video when not streaming', () => {
    render(<Video {...defaultProps} isStreaming={false} />);
    
    const video = screen.getByRole('application');
    expect(video).toHaveStyle({ display: 'none' });
  });
});