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
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #8B4513 0%, #D2691E 25%, #CD853F 50%, #DEB887 75%, #F5E6D3 100%)',
            fontFamily: '"Courier New", monospace',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* ASCII Art Background */}
            <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                opacity: 0.15,
                fontSize: '8px',
                lineHeight: '1',
                color: '#654321',
                whiteSpace: 'pre',
                fontFamily: 'monospace',
                transform: 'scale(0.8)',
                zIndex: 0,
                pointerEvents: 'none'
            }}>
                {mushroomHouse}
            </div>

            {/* Vintage Paper Texture Overlay */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                    radial-gradient(circle at 20% 20%, rgba(139, 69, 19, 0.1) 1px, transparent 1px),
                    radial-gradient(circle at 80% 80%, rgba(160, 82, 45, 0.1) 1px, transparent 1px),
                    radial-gradient(circle at 40% 60%, rgba(139, 69, 19, 0.05) 2px, transparent 2px)
                `,
                backgroundSize: '30px 30px, 25px 25px, 40px 40px',
                zIndex: 1,
                pointerEvents: 'none'
            }} />

            <div style={{
                position: 'relative',
                zIndex: 2,
                padding: '20px'
            }}>
                <header style={{
                    textAlign: 'center',
                    marginBottom: '30px'
                }}>
                    <h1 style={{
                        color: '#8B4513',
                        marginBottom: '10px',
                        fontSize: '2.5em',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                        fontWeight: 'bold',
                        letterSpacing: '2px'
                    }}>
                        🍄 VINTAGE WEBCAM COTTAGE 🍄
                    </h1>
                    <p style={{
                        color: '#654321',
                        fontSize: '1.1em',
                        fontStyle: 'italic',
                        marginBottom: '20px',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                    }}>
                        ~ A Charming Digital Photography Experience ~
                    </p>
                    <div style={{
                        width: '200px',
                        height: '3px',
                        background: 'linear-gradient(to right, transparent, #8B4513, transparent)',
                        margin: '0 auto'
                    }} />
                </header>

                {/* Webcam Feed Component */}
                <div style={{
                    maxWidth: '600px',
                    margin: '0 auto 40px auto'
                }}>
                    <WebcamFeed onImageCapture={handleImageCapture} />
                </div>

                {/* Image Gallery */}
                {capturedImages.length > 0 && (
                    <div style={{
                        marginTop: '40px',
                        padding: '30px',
                        background: 'rgba(160, 82, 45, 0.2)',
                        borderRadius: '20px',
                        backdropFilter: 'blur(10px)',
                        border: '3px solid #8B4513',
                        boxShadow: 'inset 0 0 20px rgba(139, 69, 19, 0.3)',
                        maxWidth: '800px',
                        margin: '40px auto 0 auto'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '25px'
                        }}>
                            <h3 style={{
                                color: '#8B4513',
                                margin: 0,
                                fontSize: '1.5em',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                            }}>
                                📷 Memory Collection ({capturedImages.length})
                            </h3>
                            <button
                                onClick={clearGallery}
                                style={{
                                    background: 'linear-gradient(45deg, #D2691E, #CD853F)',
                                    color: '#654321',
                                    border: '2px solid #8B4513',
                                    borderRadius: '15px',
                                    padding: '10px 20px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                                }}
                            >
                                🗑️ Clear Collection
                            </button>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '20px'
                        }}>
                            {capturedImages.map((image, index) => (
                                <div key={index} style={{
                                    position: 'relative',
                                    borderRadius: '15px',
                                    overflow: 'hidden',
                                    boxShadow: '0 8px 20px rgba(139, 69, 19, 0.4)',
                                    border: '3px solid #D2691E',
                                    background: '#F5E6D3',
                                    padding: '10px'
                                }}>
                                    <img
                                        src={image}
                                        alt={`Vintage Memory ${index + 1}`}
                                        style={{
                                            width: '100%',
                                            height: 'auto',
                                            display: 'block',
                                            borderRadius: '8px',
                                            filter: 'sepia(20%) contrast(110%) brightness(105%)'
                                        }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '15px',
                                        left: '15px',
                                        background: 'rgba(139, 69, 19, 0.8)',
                                        color: '#F5E6D3',
                                        padding: '6px 12px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                    }}>
                                        Memory #{index + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <footer style={{
                    marginTop: '60px',
                    padding: '30px',
                    textAlign: 'center',
                    background: 'rgba(139, 69, 19, 0.2)',
                    borderRadius: '20px',
                    border: '2px solid #8B4513',
                    maxWidth: '600px',
                    margin: '60px auto 20px auto'
                }}>
                    <p style={{
                        color: '#654321',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        marginBottom: '15px'
                    }}>
                        💡 Crafted with love using React + TypeScript<br />
                        Following the wisdom of the
                        <a
                            href="https://medium.com/@gk150899/building-a-webcam-app-with-reactjs-3111c1e90efb"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: '#8B4513',
                                textDecoration: 'underline',
                                marginLeft: '5px',
                                fontWeight: 'bold'
                            }}
                        >
                            Medium article scrolls
                        </a>
                    </p>
                    <p style={{
                        margin: '10px 0 0 0',
                        color: '#8B4513',
                        fontSize: '12px',
                        fontStyle: 'italic'
                    }}>
                        Enhanced with vintage styling, AI object detection, and nostalgic charm
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default App;