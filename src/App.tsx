import React, { useState, useCallback } from 'react';
import WebcamFeed from './WebcamFeed';

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

    const mushroomHouse = `          .
        ('
        '|
        |'
       [::]
       [::]   _......_
       [::].-'      _.-\`.
       [:.'    .-. '-._.-\`.
       [/ /\\   |  \\        \`-..
       / / |   \`-.'      .-.   \`-.
      /  \`-'            (   \`.    \`.
     |           /\\      \`-._/      \\
     '    .'\\   /  \`.           _.-'|
    /    /  /   \\_.-'        _.':;:/
  .'     \\_/             _.-':;_.-'
 /   .-.             _.-' \\;.-'
/   (   \\       _..-'     |
\\    \`._/  _..-'    .--.  |
 \`-.....-'/  _ _  .'    '.|
          | |_|_| |      | \\  (o)
     (o)  | |_|_| |      | | (\\'/)
    (\\'/)/ ''''' |     o|  \\;:;
     :;  |        |      |  |/)
 LGB  ;: \`-.._    /__..--'\\.' ;:
          :;  \`--' :;   :;`;

    return (
        <div className="app-container">
            <div className="ascii-background">
                {mushroomHouse}
            </div>


            <div className="main-content">
                <header className="app-header">
                    <h1 className="app-title">Are you running with scissors?</h1>
                </header>

                <div className="webcam-container">
                    <WebcamFeed onImageCapture={handleImageCapture} />
                </div>

                {capturedImages.length > 0 && (
                    <div className="gallery-container">
                        <div className="gallery-header">
                            <h3 className="gallery-title">
                                Evidence
                            </h3>
                            <button
                                onClick={clearGallery}
                                className="button-base clear-button"
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