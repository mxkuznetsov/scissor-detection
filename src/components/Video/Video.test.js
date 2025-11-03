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
    const { container } = render(<Video {...defaultProps} />);
    
    const video = container.querySelector('video');
    expect(video).toHaveClass('video-element');
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('playsinline');
  });

  it('shows loading status', () => {
    render(<Video {...defaultProps} isLoading={true} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Starting camera...')).toBeInTheDocument();
  });

  it('shows video when streaming', () => {
    const { container } = render(<Video {...defaultProps} isStreaming={true} />);
    
    const video = container.querySelector('video');
    expect(video).toHaveStyle({ display: 'block' });
  });

  it('hides video when not streaming', () => {
    const { container } = render(<Video {...defaultProps} isStreaming={false} />);
    
    const video = container.querySelector('video');
    expect(video).toHaveStyle({ display: 'none' });
  });
});