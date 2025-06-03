import React, { useState, useEffect } from 'react';

const imageCache = new Map();

export const LazyImage = ({ src, alt, className }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadImage = async () => {
            try {
                // Check if image is already in cache
                if (imageCache.has(src)) {
                    if (isMounted) {
                        setImageSrc(imageCache.get(src));
                        setIsLoading(false);
                    }
                    return;
                }

                // Start loading the image
                const response = await fetch(src);
                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);

                // Cache the image
                imageCache.set(src, objectUrl);

                if (isMounted) {
                    setImageSrc(objectUrl);
                    setIsLoading(false);
                }
            } catch (err) {
                console.error('Error loading image:', err);
                if (isMounted) {
                    setError(true);
                    setIsLoading(false);
                }
            }
        };

        loadImage();

        return () => {
            isMounted = false;
        };
    }, [src]);

    if (isLoading) {
        return (
            <div className={`${className} bg-gray-200 animate-pulse flex items-center justify-center`}>
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${className} bg-gray-200 flex items-center justify-center`}>
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
        );
    }

    return (
        <img
            src={imageSrc}
            alt={alt}
            className={className}
            loading="lazy"
            onError={() => setError(true)}
        />
    );
}; 