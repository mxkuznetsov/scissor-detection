import React, { useState, useCallback } from 'react';
import WebcamFeed from './WebcamFeed';
import './WebcamFeed.css';

const App: React.FC = () => {
    const [capturedImages, setCapturedImages] = useState<string[]>([]);

    // Handle image capture from webcam component
    const handleImageCapture = useCallback((imageDataUrl: string) => {
        setCapturedImages(prev => [...prev, imageDataUrl]);
        console.log('📸 New image captured and added to gallery');
    }, []);

    // Clear all captured images
    const clearGallery = useCallback(() => {
        setCapturedImages([]);
    }, []);

    return (
        <div className="App">
            <header className="App-header" style={{ padding: '20px' }}>
                <h1 style={{ color: 'white', marginBottom: '30px' }}>
                    🎥 Webcam Capture App
                </h1>

                {/* Webcam Feed Component */}
                <WebcamFeed onImageCapture={handleImageCapture} />

                {/* Image Gallery */}
                {capturedImages.length > 0 && (
                    <div style={{
                        marginTop: '40px',
                        padding: '20px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '15px',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ color: 'white', margin: 0 }}>
                                📷 Captured Images ({capturedImages.length})
                            </h3>
                            <button
                                onClick={clearGallery}
                                style={{
                                    background: 'linear-gradient(45deg, #ff4757, #ff3742)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '20px',
                                    padding: '8px 16px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                🗑️ Clear All
                            </button>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: '15px',
                            maxWidth: '800px'
                        }}>
                            {capturedImages.map((image, index) => (
                                <div key={index} style={{
                                    position: 'relative',
                                    borderRadius: '10px',
                                    overflow: 'hidden',
                                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
                                }}>
                                    <img
                                        src={image}
                                        alt={`Captured ${index + 1}`}
                                        style={{
                                            width: '100%',
                                            height: 'auto',
                                            display: 'block'
                                        }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '5px',
                                        left: '5px',
                                        background: 'rgba(0, 0, 0, 0.7)',
                                        color: 'white',
                                        padding: '4px 8px',
                                        borderRadius: '10px',
                                        fontSize: '12px'
                                    }}>
                                        #{index + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <footer style={{
                    marginTop: '40px',
                    padding: '20px',
                    color: '#888',
                    textAlign: 'center',
                    fontSize: '14px'
                }}>
                    <p>
                        💡 Built with React + TypeScript following the
                        <a
                            href="https://medium.com/@gk150899/building-a-webcam-app-with-reactjs-3111c1e90efb"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#667eea', textDecoration: 'none', marginLeft: '5px' }}
                        >
                            Medium article tutorial
                        </a>
                    </p>
                    <p style={{ margin: '10px 0 0 0' }}>
                        Enhanced with styled-components, TypeScript interfaces, and image gallery
                    </p>
                </footer>
            </header>
        </div>
    );
};

export default App;