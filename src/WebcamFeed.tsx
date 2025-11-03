import React, { useState, useRef, useCallback } from 'react';
import styled from 'styled-components';

// Define styled components for styling (from Medium article)
const WebcamContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const WebcamVideo = styled.video`
  width: 100%;
  max-width: 640px;
  height: auto;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  background: #000;
`;

const PreviewImg = styled.img`
  width: 100%;
  max-width: 640px;
  height: auto;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
`;

const WebcamCanvas = styled.canvas`
  display: none; /* Hide canvas by default */
`;

const WebcamButton = styled.button`
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatusText = styled.p`
  color: white;
  font-size: 14px;
  text-align: center;
  margin: 10px 0;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
`;

const ErrorText = styled.p`
  color: #ff4757;
  font-size: 14px;
  text-align: center;
  margin: 10px 0;
  background: rgba(255, 71, 87, 0.1);
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 71, 87, 0.3);
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
`;

// TypeScript interfaces
interface WebcamFeedProps {
    onImageCapture?: (imageDataUrl: string) => void;
}

const WebcamFeed: React.FC<WebcamFeedProps> = ({ onImageCapture }) => {
    // State management with TypeScript types
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Refs with TypeScript types
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Start webcam function (based on Medium article)
    const startWebcam = useCallback(async (): Promise<void> => {
        if (isLoading) return;

        try {
            setIsLoading(true);
            setError(null);
            console.log('🎥 Starting webcam...');

            // Check browser support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera access not supported in this browser');
            }

            // Request webcam access
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                setStream(mediaStream);

                // Wait for video to load
                await new Promise<void>((resolve, reject) => {
                    if (!videoRef.current) {
                        reject(new Error('Video element not available'));
                        return;
                    }

                    const video = videoRef.current;

                    const onLoadedMetadata = () => {
                        console.log('🎥 Video metadata loaded');
                        video.removeEventListener('loadedmetadata', onLoadedMetadata);
                        video.removeEventListener('error', onError);
                        setIsStreaming(true);
                        resolve();
                    };

                    const onError = (error: Event) => {
                        console.error('Video error:', error);
                        video.removeEventListener('loadedmetadata', onLoadedMetadata);
                        video.removeEventListener('error', onError);
                        reject(new Error('Failed to load video'));
                    };

                    video.addEventListener('loadedmetadata', onLoadedMetadata);
                    video.addEventListener('error', onError);
                });

                console.log('🎥 Webcam started successfully');
            }

        } catch (err) {
            console.error('Error starting webcam:', err);
            handleWebcamError(err);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]);

    // Stop webcam function (based on Medium article)
    const stopWebcam = useCallback((): void => {
        console.log('🎥 Stopping webcam...');

        if (stream) {
            stream.getTracks().forEach((track: MediaStreamTrack) => {
                track.stop();
                console.log(`🎥 Stopped track: ${track.kind}`);
            });
            setStream(null);
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsStreaming(false);
        setError(null);
        console.log('🎥 Webcam stopped successfully');
    }, [stream]);

    // Capture image function (based on Medium article)
    const captureImage = useCallback((): void => {
        if (!videoRef.current || !canvasRef.current) {
            setError('Video or canvas not available');
            return;
        }

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (!context) {
                setError('Could not get canvas context');
                return;
            }

            // Set canvas size to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw current video frame to canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to data URL
            const imageDataUrl = canvas.toDataURL('image/png');
            setCapturedImage(imageDataUrl);

            // Call callback if provided
            if (onImageCapture) {
                onImageCapture(imageDataUrl);
            }

            console.log('📸 Image captured successfully');
        } catch (err) {
            console.error('Error capturing image:', err);
            setError('Failed to capture image');
        }
    }, [onImageCapture]);

    // Reset state function (based on Medium article)
    const resetState = useCallback((): void => {
        stopWebcam();
        setCapturedImage(null);
        setError(null);
    }, [stopWebcam]);

    // Error handling function
    const handleWebcamError = (err: any): void => {
        let errorMessage = 'Failed to access camera. ';

        if (err instanceof Error) {
            switch (err.name) {
                case 'NotAllowedError':
                    errorMessage += 'Camera permission denied. Please allow camera access.';
                    break;
                case 'NotFoundError':
                    errorMessage += 'No camera found. Please ensure a camera is connected.';
                    break;
                case 'NotReadableError':
                    errorMessage += 'Camera is already in use by another application.';
                    break;
                case 'OverconstrainedError':
                    errorMessage += 'Camera does not support the requested settings.';
                    break;
                case 'SecurityError':
                    errorMessage += 'Camera access blocked by security settings.';
                    break;
                default:
                    errorMessage += err.message;
            }
        }

        setError(errorMessage);
        setIsStreaming(false);
    };

    // Download captured image
    const downloadImage = useCallback((): void => {
        if (!capturedImage) return;

        const link = document.createElement('a');
        link.download = `webcam-capture-${new Date().toISOString()}.png`;
        link.href = capturedImage;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [capturedImage]);

    return (
        <WebcamContainer>
            <h2 style={{ color: 'white', textAlign: 'center', margin: '0 0 20px 0' }}>
                📹 Webcam Capture
            </h2>

            {error && <ErrorText>⚠️ {error}</ErrorText>}

            {capturedImage ? (
                // Show captured image (Medium article pattern)
                <>
                    <PreviewImg src={capturedImage} alt="Captured" />
                    <StatusText>✅ Image captured successfully!</StatusText>
                    <ControlsContainer>
                        <WebcamButton onClick={downloadImage}>
                            💾 Download Image
                        </WebcamButton>
                        <WebcamButton onClick={resetState}>
                            🔄 Reset
                        </WebcamButton>
                    </ControlsContainer>
                </>
            ) : (
                // Show webcam feed (Medium article pattern)
                <>
                    <WebcamVideo
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{
                            display: isStreaming ? 'block' : 'none'
                        }}
                    />
                    <WebcamCanvas ref={canvasRef} />

                    {!isStreaming && !isLoading && (
                        <StatusText>📷 Click "Start Webcam" to begin</StatusText>
                    )}

                    {isLoading && (
                        <StatusText>🔄 Starting camera...</StatusText>
                    )}

                    {isStreaming && (
                        <StatusText>🟢 Camera is active</StatusText>
                    )}

                    <ControlsContainer>
                        {!isStreaming ? (
                            <WebcamButton
                                onClick={startWebcam}
                                disabled={isLoading}
                            >
                                {isLoading ? '🔄 Starting...' : '📹 Start Webcam'}
                            </WebcamButton>
                        ) : (
                            <>
                                <WebcamButton onClick={captureImage}>
                                    📸 Capture Image
                                </WebcamButton>
                                <WebcamButton onClick={stopWebcam}>
                                    ⏹️ Stop Webcam
                                </WebcamButton>
                            </>
                        )}
                    </ControlsContainer>
                </>
            )}
        </WebcamContainer>
    );
};

export default WebcamFeed;