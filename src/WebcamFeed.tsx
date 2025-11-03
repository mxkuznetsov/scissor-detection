import React, { useState, useRef, useCallback, useEffect } from 'react';
import { usePersonDetection } from './__hooks__/usePersonDetection';

const VIDEO_CONSTRAINTS = {
    video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
    },
    audio: false
} as const;

const DETECTION_INTERVAL = 500;

interface WebcamFeedProps {
    onImageCapture?: (imageDataUrl: string) => void;
}

type WebcamError = 'NotAllowedError' | 'NotFoundError' | 'NotReadableError' | 'OverconstrainedError' | 'SecurityError';

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

        console.error(`${contextPrefix}Error:`, err);

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

interface StatusDisplayProps {
    isLoading: boolean;
    isStreaming: boolean;
    modelLoaded: boolean;
    isDetecting: boolean;
    modelError: string | null;
    detectionSummary: string;
    capturedImage: string | null;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({
    isLoading,
    isStreaming,
    modelLoaded,
    isDetecting,
    modelError,
    detectionSummary,
    capturedImage
}) => {
    if (capturedImage) {
        console.log('Image captured successfully!');
        return null;
    }

    if (!isStreaming && !isLoading) {
        console.log('Initializing camera...');
        return null;
    }

    if (isLoading) {
        console.log('Starting camera...');
        return null;
    }

    if (isStreaming) {
        const aiStatus = modelLoaded ?
            `AI Detection: ${isDetecting ? 'Running' : 'Ready'}${detectionSummary}` :
            'Loading AI model...';

        const errorStatus = modelError ? 'AI model error' : '';

        console.log(`Camera is active ${aiStatus} ${errorStatus}`.trim());
        return null;
    }

    return null;
};

interface VideoDisplayProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    isStreaming: boolean;
    detectedPersons: any[];
    capturedImage: string | null;
}

const VideoDisplay: React.FC<VideoDisplayProps> = ({
    videoRef,
    isStreaming,
    detectedPersons,
    capturedImage
}) => {
    return (
        <div className="video-container">
            {capturedImage ? (
                <img src={capturedImage} alt="Captured" className="preview-image" />
            ) : (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="webcam-video"
                        style={{
                            display: isStreaming ? 'block' : 'none'
                        }}
                    />
                    {isStreaming && detectedPersons.length > 0 && (
                        <div className="detection-overlay">
                            {detectedPersons.map((detection, index) => (
                                <div
                                    key={`${detection.timestamp.getTime()}-${index}`}
                                    className={`bounding-box ${detection.className}`}
                                    style={{
                                        left: `${detection.bbox[0]}px`,
                                        top: `${detection.bbox[1]}px`,
                                        width: `${detection.bbox[2]}px`,
                                        height: `${detection.bbox[3]}px`
                                    }}
                                    data-label={`${detection.className} ${Math.round(detection.confidence * 100)}%`}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

interface ControlsProps {
    error: string | null;
    capturedImage: string | null;
    isStreaming: boolean;
    onStartWebcam: () => void;
    onCaptureImage: () => void;
    onDownloadImage: () => void;
    onReset: () => void;
}

const Controls: React.FC<ControlsProps> = ({
    error,
    capturedImage,
    isStreaming,
    onStartWebcam,
    onCaptureImage,
    onDownloadImage,
    onReset
}) => {
    return (
        <div className="controls-container">
            {error && (
                <button onClick={onStartWebcam} className="button-base webcam-button">
                    Retry camera
                </button>
            )}

            {capturedImage && (
                <>
                    <button onClick={onDownloadImage} className="button-base webcam-button">
                        Download image
                    </button>
                    <button onClick={onReset} className="button-base webcam-button">
                        Reset
                    </button>
                </>
            )}

            {!error && !capturedImage && isStreaming && (
                <button onClick={onCaptureImage} className="button-base webcam-button">
                    Snag evidence
                </button>
            )}
        </div>
    );
};

const WebcamFeed: React.FC<WebcamFeedProps> = ({ onImageCapture }) => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { detectedPersons, isDetecting, modelLoaded, error: modelError, detectPersons } = usePersonDetection();

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
                console.log('🎥 Video metadata loaded');
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
            console.log('Starting webcam...');

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera access not supported in this browser');
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                setStream(mediaStream);

                await waitForVideoLoad(videoRef.current);
                console.log('🎥 Webcam started successfully');
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

    const stopWebcam = useCallback((): void => {
        console.log('Stopping webcam...');

        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsStreaming(false);
        setError(null);
        console.log('🎥 Webcam stopped successfully');
    }, [stream]);

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

            console.log('Image captured successfully');
        } catch (err) {
            handleError(err, 'Failed to capture image');
        }
    }, [onImageCapture, handleError]);

    const resetState = useCallback((): void => {
        stopWebcam();
        setCapturedImage(null);
        setError(null);
    }, [stopWebcam]);

    const getDetectionSummary = useCallback(() => {
        if (detectedPersons.length === 0) return '';

        const counts = detectedPersons.reduce((acc, det) => {
            acc[det.className] = (acc[det.className] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const summary = Object.entries(counts)
            .map(([className, count]) => `${count} ${className}${count !== 1 ? 's' : ''}`)
            .join(', ');

        return ` (${summary} detected)`;
    }, [detectedPersons]);

    const hasScissorsDetected = detectedPersons.some(det => det.className === 'scissors');

    const downloadImage = useCallback((): void => {
        if (!capturedImage) return;

        try {
            const link = document.createElement('a');
            link.download = `webcam-capture-${new Date().toISOString()}.png`;
            link.href = capturedImage;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            handleError(err, 'Failed to download image');
        }
    }, [capturedImage, handleError]);

    return (
        <div className="webcam-component-container">
            {error && <p className="helper-text-base error-text">{error}</p>}

            <VideoDisplay
                videoRef={videoRef}
                isStreaming={isStreaming}
                detectedPersons={detectedPersons}
                capturedImage={capturedImage}
            />

            <canvas ref={canvasRef} className="webcam-canvas" />

            <StatusDisplay
                isLoading={isLoading}
                isStreaming={isStreaming}
                modelLoaded={modelLoaded}
                isDetecting={isDetecting}
                modelError={modelError}
                detectionSummary={getDetectionSummary()}
                capturedImage={capturedImage}
            />

            {isStreaming && hasScissorsDetected && (
                <div className="helper-text-base scissors-alert">
                    ✂️ Oh boy! Scissors on the loose! ✂️
                </div>
            )}

            <Controls
                error={error}
                capturedImage={capturedImage}
                isStreaming={isStreaming}
                onStartWebcam={startWebcam}
                onCaptureImage={captureImage}
                onDownloadImage={downloadImage}
                onReset={resetState}
            />
        </div>
    );
};

export default WebcamFeed;