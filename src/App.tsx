import React, { useState, useCallback } from 'react';
import WebcamFeed from './WebcamFeed';

const App: React.FC = () => {
    const [capturedImages, setCapturedImages] = useState<string[]>([]);

    const handleImageCapture = useCallback((imageDataUrl: string) => {
        setCapturedImages(prev => [...prev, imageDataUrl]);
    }, []);

    const clearGallery = useCallback(() => {
        setCapturedImages([]);
    }, []);

    return (
        <div className="app-container">

            <div className="app-content">
                <header className="app-header">
                    <h1 className="app-title">Are you running with scissors?</h1>
                </header>

                <div className="video-container">
                    <WebcamFeed onImageCapture={handleImageCapture} />
                </div>

                {capturedImages.length > 0 && (
                    <div className="gallery-container">
                        <div className="gallery-header">
                            <button
                                onClick={clearGallery}
                                className="button-base gallery-button"
                            >
                                Destroy the evidence
                            </button>
                        </div>

                        <div className="gallery-grid">
                            {capturedImages.map((image, index) => (
                                <div key={index} className="gallery-item">
                                    <img
                                        src={image}
                                        alt={`""`}
                                        className="gallery-image"
                                    />
                                    <div className="gallery-label">
                                        Evidence #{index + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;