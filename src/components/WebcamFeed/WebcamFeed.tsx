import React, { useState, useRef, useCallback, useEffect } from 'react';
import { usePersonDetection } from '../../__hooks__/usePersonDetection';
import VideoDisplay from '../Video/Video';

interface WebcamFeedProps {
    onImageCapture?: (imageDataUrl: string) => void;
}

type WebcamError = 'NotAllowedError' | 'NotFoundError' | 'NotReadableError' | 'OverconstrainedError' | 'SecurityError';

const VIDEO_CONSTRAINTS = {
    video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
    },
    audio: false
} as const;

const DETECTION_INTERVAL = 500;

const ERROR_MESSAGES: Record<WebcamError, string> = {
    NotAllowedError: 'Camera permission denied. Please allow camera access.',
    NotFoundError: 'No camera found. Please ensure a camera is connected.',
    NotReadableError: 'Camera is already in use by another application.',
    OverconstrainedError: 'Camera does not support the requested settings.',
    SecurityError: 'Camera access blocked by security settings.'
};

const createErrorHandler = (setError: (error: string) => void, setIsStreaming: (streaming: boolean) => void) => {
    return (err: any, context: string = ''): void => {
        const contextPrefix = context ? `${context}: ` : '';

        if (err instanceof Error && err.name in ERROR_MESSAGES) {
            setError(`${contextPrefix}${ERROR_MESSAGES[err.name as WebcamError]}`);
        } else if (err?.message) {
            setError(`${contextPrefix}${err.message}`);
        } else {
            setError(`${contextPrefix}An unexpected error occurred`);
        }

        setIsStreaming(false);
    };
};

const WebcamFeed: React.FC<WebcamFeedProps> = ({ onImageCapture }) => {
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [hasAutoCapture, setHasAutoCapture] = useState<boolean>(false);
    const [showScissorsAlert, setShowScissorsAlert] = useState<boolean>(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { detectedPersons, modelLoaded, error: modelError, detectPersons } = usePersonDetection();

    const handleError = createErrorHandler(setError, setIsStreaming);

    useEffect(() => {
        if (modelError) {
            handleError(new Error(modelError), 'AI Model Error');
        }
    }, [modelError, handleError]);

    useEffect(() => {
        let detectionInterval: NodeJS.Timeout | null = null;

        if (isStreaming && videoRef.current && modelLoaded && !error) {
            detectionInterval = setInterval(async () => {
                if (videoRef.current && !error) {
                    try {
                        await detectPersons(videoRef.current);
                    } catch (err) {
                        handleError(err, 'Detection failed');
                    }
                }
            }, DETECTION_INTERVAL);
        }

        return () => {
            if (detectionInterval) {
                clearInterval(detectionInterval);
            }
        };
    }, [isStreaming, modelLoaded, detectPersons, handleError, error]);

    const waitForVideoLoad = useCallback((video: HTMLVideoElement): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            const onLoadedMetadata = () => {
                video.removeEventListener('loadedmetadata', onLoadedMetadata);
                video.removeEventListener('error', onError);
                setIsStreaming(true);
                resolve();
            };

            const onError = (error: Event) => {
                video.removeEventListener('loadedmetadata', onLoadedMetadata);
                video.removeEventListener('error', onError);
                reject(new Error('Failed to load video'));
            };

            video.addEventListener('loadedmetadata', onLoadedMetadata);
            video.addEventListener('error', onError);
        });
    }, []);
    const startWebcam = useCallback(async (): Promise<void> => {
        if (isLoading) return;

        try {
            setIsLoading(true);
            setError(null);

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera access not supported in this browser');
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await waitForVideoLoad(videoRef.current);
            }

        } catch (err) {
            handleError(err, 'Failed to start camera');
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, waitForVideoLoad, handleError]);

    useEffect(() => {
        if (!isStreaming && !isLoading && !error) {
            startWebcam();
        }
    }, [startWebcam, isStreaming, isLoading, error]);

    const captureImage = useCallback((): void => {
        if (!videoRef.current || !canvasRef.current) {
            handleError(new Error('Video or canvas not available'), 'Capture failed');
            return;
        }

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (!context) {
                handleError(new Error('Could not get canvas context'), 'Capture failed');
                return;
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageDataUrl = canvas.toDataURL('image/png');
            setCapturedImage(imageDataUrl);

            if (onImageCapture) {
                onImageCapture(imageDataUrl);
            }
        } catch (err) {
            handleError(err, 'Failed to capture image');
        }
    }, [onImageCapture, handleError]);

    const hasScissorsDetected = detectedPersons.some(det => det.className === 'scissors');

    useEffect(() => {
        if (hasScissorsDetected && !capturedImage && !hasAutoCapture && isStreaming) {
            setHasAutoCapture(true);
            setShowScissorsAlert(true);
            captureImage();

            const timer = setTimeout(() => {
                setShowScissorsAlert(false);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [hasScissorsDetected, capturedImage, hasAutoCapture, isStreaming, captureImage]);

    return (
        <div className="video-component">
            {error && <p className="helper-text-base error-text">{error}</p>}

            <VideoDisplay
                videoRef={videoRef}
                isStreaming={isStreaming}
                isLoading={isLoading}
                detectedPersons={detectedPersons}
                capturedImage={capturedImage}
                hasScissorsDetected={hasScissorsDetected}
            />

            <canvas ref={canvasRef} className="video-canvas" />
            {showScissorsAlert && (
                <div className="helper-text-base scissors-alert">
                    ✂️ Oh boy! Scissors on the loose! ✂️
                </div>
            )}

            <div className="controls-container">
                {error && (
                    <button onClick={startWebcam} className="button-base video-button">
                        Retry camera
                    </button>
                )}
            </div>
        </div>
    );
};

export default WebcamFeed;