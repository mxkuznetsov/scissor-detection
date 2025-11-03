import React, { useState, useRef, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { usePersonDetection } from './usePersonDetection';

// Define styled components for vintage styling
const WebcamContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 30px;
  background: linear-gradient(135deg, rgba(160, 82, 45, 0.3) 0%, rgba(139, 69, 19, 0.2) 50%, rgba(210, 180, 140, 0.3) 100%);
  border-radius: 25px;
  border: 3px solid #8B4513;
  box-shadow: 
    0 15px 35px rgba(139, 69, 19, 0.4),
    inset 0 0 20px rgba(160, 82, 45, 0.1);
  backdrop-filter: blur(10px);
  font-family: 'Courier New', monospace;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 30% 30%, rgba(139, 69, 19, 0.1) 1px, transparent 1px),
      radial-gradient(circle at 70% 70%, rgba(160, 82, 45, 0.1) 1px, transparent 1px);
    background-size: 20px 20px, 15px 15px;
    border-radius: 25px;
    pointer-events: none;
  }
`;

const WebcamVideo = styled.video`
  width: 100%;
  max-width: 640px;
  height: auto;
  border-radius: 20px;
  border: 4px solid #D2691E;
  box-shadow: 
    0 8px 20px rgba(139, 69, 19, 0.4),
    inset 0 0 10px rgba(160, 82, 45, 0.2);
  background: #000;
  filter: sepia(10%) contrast(105%) brightness(103%);
  position: relative;
  z-index: 2;
`;

const VideoContainer = styled.div`
  position: relative;
  display: inline-block;
  border-radius: 20px;
  overflow: hidden;
  
  &::before {
    content: "       /\\\\\\00000A      /  \\\\\\00000A     /_  _\\\\\\00000A      |  |\\00000A    __|__|__\\00000A   |        |\\00000A   | []  [] |\\00000A   |   <>   |\\00000A   |________|\\00000A      |  |\\00000A      |  |";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-family: 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.1;
    color: rgba(139, 69, 19, 0.2);
    white-space: pre;
    z-index: 1;
    pointer-events: none;
    text-align: center;
    opacity: 0.7;
  }
`;

const DetectionOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  border-radius: 20px;
  overflow: hidden;
  z-index: 3;
`;

const BoundingBox = styled.div<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    className: string;
}>`
  position: absolute;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  border: 4px solid ${props => props.className === 'scissors' ? '#CD853F' : '#8B4513'};
  border-radius: 8px;
  box-shadow: 
    0 0 15px ${props => props.className === 'scissors' ? 'rgba(205, 133, 63, 0.8)' : 'rgba(139, 69, 19, 0.8)'},
    inset 0 0 5px rgba(245, 230, 211, 0.3);
  backdrop-filter: blur(2px);
  
  &::after {
    content: '${props => props.className} ${props => Math.round(props.confidence * 100)}%';
    position: absolute;
    top: -35px;
    left: 0;
    background: linear-gradient(45deg, 
      ${props => props.className === 'scissors' ? 'rgba(205, 133, 63, 0.95)' : 'rgba(139, 69, 19, 0.95)'}, 
      ${props => props.className === 'scissors' ? 'rgba(210, 180, 140, 0.95)' : 'rgba(160, 82, 45, 0.95)'});
    color: #F5E6D3;
    padding: 6px 12px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: bold;
    font-family: 'Courier New', monospace;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
    border: 2px solid ${props => props.className === 'scissors' ? '#8B4513' : '#654321'};
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`;

const PreviewImg = styled.img`
  width: 100%;
  max-width: 640px;
  height: auto;
  border-radius: 20px;
  border: 4px solid #D2691E;
  box-shadow: 
    0 8px 20px rgba(139, 69, 19, 0.4),
    inset 0 0 10px rgba(160, 82, 45, 0.2);
  filter: sepia(15%) contrast(110%) brightness(105%);
`;

const WebcamCanvas = styled.canvas`
  display: none; /* Hide canvas by default */
`;

const WebcamButton = styled.button`
  background: linear-gradient(45deg, #D2691E, #CD853F, #DEB887);
  color: #654321;
  border: 3px solid #8B4513;
  border-radius: 20px;
  padding: 15px 30px;
  font-size: 16px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 
    0 6px 15px rgba(139, 69, 19, 0.3),
    inset 0 1px 0 rgba(245, 230, 211, 0.5);
  text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 30% 30%, rgba(245, 230, 211, 0.1) 1px, transparent 1px),
      radial-gradient(circle at 70% 70%, rgba(139, 69, 19, 0.1) 1px, transparent 1px);
    background-size: 15px 15px, 10px 10px;
    pointer-events: none;
  }
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 
      0 8px 20px rgba(139, 69, 19, 0.4),
      inset 0 1px 0 rgba(245, 230, 211, 0.7);
    background: linear-gradient(45deg, #CD853F, #DEB887, #F5E6D3);
  }
  
  &:active {
    transform: translateY(-1px);
    box-shadow: 
      0 4px 10px rgba(139, 69, 19, 0.3),
      inset 0 2px 4px rgba(139, 69, 19, 0.2);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    background: linear-gradient(45deg, #A0522D, #8B4513);
    color: #F5E6D3;
  }
`;

const StatusText = styled.p`
  color: #654321;
  font-size: 16px;
  text-align: center;
  margin: 15px 0;
  background: linear-gradient(135deg, rgba(245, 230, 211, 0.8), rgba(222, 184, 135, 0.6));
  padding: 12px 20px;
  border-radius: 20px;
  border: 2px solid #D2691E;
  box-shadow: 
    0 4px 10px rgba(139, 69, 19, 0.2),
    inset 0 1px 0 rgba(245, 230, 211, 0.5);
  backdrop-filter: blur(10px);
  font-family: 'Courier New', monospace;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
  letter-spacing: 0.5px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 25% 25%, rgba(139, 69, 19, 0.05) 1px, transparent 1px),
      radial-gradient(circle at 75% 75%, rgba(160, 82, 45, 0.05) 1px, transparent 1px);
    background-size: 12px 12px, 8px 8px;
    border-radius: 20px;
    pointer-events: none;
  }
`;

const ErrorText = styled.p`
  color: #8B4513;
  font-size: 16px;
  text-align: center;
  margin: 15px 0;
  background: linear-gradient(135deg, rgba(255, 192, 203, 0.3), rgba(255, 160, 122, 0.2));
  padding: 12px 20px;
  border-radius: 20px;
  border: 2px solid #CD853F;
  box-shadow: 
    0 4px 10px rgba(139, 69, 19, 0.2),
    inset 0 1px 0 rgba(245, 230, 211, 0.3);
  backdrop-filter: blur(10px);
  font-family: 'Courier New', monospace;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
  letter-spacing: 0.5px;
`;

const ScissorsAlert = styled.div`
  color: #8B4513;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  margin: 15px 0;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.9), rgba(255, 165, 0, 0.8));
  padding: 15px 25px;
  border-radius: 20px;
  border: 3px solid #CD853F;
  box-shadow: 
    0 6px 15px rgba(139, 69, 19, 0.3),
    inset 0 1px 0 rgba(245, 230, 211, 0.8),
    0 0 20px rgba(255, 215, 0, 0.5);
  backdrop-filter: blur(10px);
  font-family: 'Courier New', monospace;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  letter-spacing: 1px;
  animation: scissorsGlow 2s ease-in-out infinite alternate;
  text-transform: uppercase;
  
  @keyframes scissorsGlow {
    0% {
      box-shadow: 
        0 6px 15px rgba(139, 69, 19, 0.3),
        inset 0 1px 0 rgba(245, 230, 211, 0.8),
        0 0 20px rgba(255, 215, 0, 0.5);
    }
    100% {
      box-shadow: 
        0 8px 20px rgba(139, 69, 19, 0.4),
        inset 0 1px 0 rgba(245, 230, 211, 0.9),
        0 0 30px rgba(255, 215, 0, 0.8);
    }
  }
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

    // Person detection hook
    const { detectedPersons, isDetecting, modelLoaded, error: modelError, detectPersons } = usePersonDetection();

    // Effect to run person detection when video is streaming
    useEffect(() => {
        let detectionInterval: NodeJS.Timeout | null = null;

        if (isStreaming && videoRef.current && modelLoaded) {
            detectionInterval = setInterval(async () => {
                if (videoRef.current) {
                    try {
                        await detectPersons(videoRef.current);
                    } catch (err) {
                        console.error('Detection error:', err);
                    }
                }
            }, 500); // Run detection every 500ms
        }

        return () => {
            if (detectionInterval) {
                clearInterval(detectionInterval);
            }
        };
    }, [isStreaming, modelLoaded, detectPersons]);

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
            <h2 style={{
                color: '#654321',
                textAlign: 'center',
                margin: '0 0 25px 0',
                fontSize: '1.8em',
                fontFamily: 'Courier New, monospace',
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                background: 'linear-gradient(135deg, rgba(245, 230, 211, 0.3), rgba(222, 184, 135, 0.2))',
                padding: '15px 25px',
                borderRadius: '15px',
                border: '2px solid #D2691E',
                boxShadow: '0 4px 10px rgba(139, 69, 19, 0.2)',
                position: 'relative',
                zIndex: 3
            }}>
                🎥 VINTAGE CAPTURE STATION 🎥
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
                    <VideoContainer>
                        <WebcamVideo
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            style={{
                                display: isStreaming ? 'block' : 'none'
                            }}
                        />
                        {isStreaming && detectedPersons.length > 0 && (
                            <DetectionOverlay>
                                {detectedPersons.map((detection, index) => (
                                    <BoundingBox
                                        key={`${detection.timestamp.getTime()}-${index}`}
                                        x={detection.bbox[0]}
                                        y={detection.bbox[1]}
                                        width={detection.bbox[2]}
                                        height={detection.bbox[3]}
                                        confidence={detection.confidence}
                                        className={detection.className}
                                    />
                                ))}
                            </DetectionOverlay>
                        )}
                    </VideoContainer>
                    <WebcamCanvas ref={canvasRef} />

                    {!isStreaming && !isLoading && (
                        <StatusText>📷 Click "Start Webcam" to begin</StatusText>
                    )}

                    {isLoading && (
                        <StatusText>🔄 Starting camera...</StatusText>
                    )}

                    {isStreaming && (
                        <StatusText>
                            🟢 Camera is active
                            {modelLoaded ? (
                                <span style={{ marginLeft: '10px' }}>
                                    🤖 AI Detection: {isDetecting ? 'Running' : 'Ready'}
                                    {detectedPersons.length > 0 && (() => {
                                        const counts = detectedPersons.reduce((acc, det) => {
                                            acc[det.className] = (acc[det.className] || 0) + 1;
                                            return acc;
                                        }, {} as Record<string, number>);
                                        const summary = Object.entries(counts)
                                            .map(([className, count]) => `${count} ${className}${count !== 1 ? 's' : ''}`)
                                            .join(', ');
                                        return ` (${summary} detected)`;
                                    })()}
                                </span>
                            ) : (
                                <span style={{ marginLeft: '10px' }}>🔄 Loading AI model...</span>
                            )}
                            {modelError && (
                                <span style={{ marginLeft: '10px', color: '#ff6b6b' }}>
                                    ⚠️ AI model error
                                </span>
                            )}
                        </StatusText>
                    )}

                    {/* Scissors Detection Alert */}
                    {isStreaming && detectedPersons.some(det => det.className === 'scissors') && (
                        <ScissorsAlert>
                            ✂️ Oh boy! Scissors on the loose! ✂️
                        </ScissorsAlert>
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