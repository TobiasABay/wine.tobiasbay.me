import { useState, useEffect } from 'react';

export const useFullscreen = () => {
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    const toggleFullscreen = async () => {
        try {
            const element = document.documentElement;

            // Check for various fullscreen methods (cross-browser compatibility)
            const isCurrentlyFullscreen = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement
            );

            if (!isCurrentlyFullscreen) {
                // Try different fullscreen methods for cross-browser support
                if (element.requestFullscreen) {
                    await element.requestFullscreen();
                } else if ((element as any).webkitRequestFullscreen) {
                    await (element as any).webkitRequestFullscreen();
                } else if ((element as any).mozRequestFullScreen) {
                    await (element as any).mozRequestFullScreen();
                } else if ((element as any).msRequestFullscreen) {
                    await (element as any).msRequestFullscreen();
                } else {
                    // Fallback for iOS - try to hide the address bar
                    if (window.scrollTo) {
                        window.scrollTo(0, 1);
                    }
                    console.warn('Fullscreen API not supported, using fallback');
                }
                setIsFullscreen(true);
            } else {
                // Exit fullscreen
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ((document as any).webkitExitFullscreen) {
                    await (document as any).webkitExitFullscreen();
                } else if ((document as any).mozCancelFullScreen) {
                    await (document as any).mozCancelFullScreen();
                } else if ((document as any).msExitFullscreen) {
                    await (document as any).msExitFullscreen();
                }
                setIsFullscreen(false);
            }
        } catch (error) {
            console.error('Error toggling fullscreen:', error);
            // For iOS, try a different approach
            if (navigator.userAgent.match(/iPad|iPhone|iPod/)) {
                // iOS fallback - scroll to hide address bar
                if (window.scrollTo) {
                    window.scrollTo(0, 1);
                    setTimeout(() => window.scrollTo(0, 0), 100);
                }
            }
        }
    };

    // Listen for fullscreen changes (important for iOS)
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement
            );
            setIsFullscreen(isCurrentlyFullscreen);
        };

        // Add event listeners for different browsers
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    return { isFullscreen, toggleFullscreen };
};
