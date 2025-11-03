import React from 'react';

interface VideoProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    isStreaming: boolean;
    isLoading: boolean;
    detectedPersons: any[];
    capturedImage: string | null;
    hasScissorsDetected: boolean;
}

const Video: React.FC<VideoProps> = ({
    videoRef,
    isStreaming,
    isLoading,
    detectedPersons,
    capturedImage,
    hasScissorsDetected
}) => {
    return (
        <div className={`video-display ${hasScissorsDetected ? 'scissors-detected' : ''}`}>
            {isLoading && (
                <div className="video-loading" role="status" aria-live="polite">
                    <div className="video-loading-content">
                        <div className="video-loading-spinner" aria-hidden="true"></div>
                        <p>Starting camera...</p>
                    </div>
                </div>
            )}
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="video-element"
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
                            data-testid={`bounding-box-${index}`}
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
        </div>
    );
};

export default Video;