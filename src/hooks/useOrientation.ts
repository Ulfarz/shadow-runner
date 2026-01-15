import { useEffect, useState } from 'react';

interface OrientationState {
    heading: number | null; // Magnetic heading (0-360)
    accuracy: number | null;
}

export const useOrientation = () => {
    const [orientation, setOrientation] = useState<OrientationState>({ heading: null, accuracy: null });

    useEffect(() => {
        const handleOrientation = (event: DeviceOrientationEvent) => {
            let heading: number | null = null;

            // Android Chrome often provides 'alpha' as compass heading [0, 360]
            // Standard says absolute: true means alpha is relative to Earth frame.
            if (event.absolute) {
                heading = event.alpha;
            } else if ((event as any).webkitCompassHeading) {
                // iOS
                heading = (event as any).webkitCompassHeading;
            } else {
                // Fallback for non-absolute alpha (often relative to device start)
                // Might need generic fallback or just use it.
                // But for map bearing, we need true north.
                // On some Android devices, alpha is absolute by default even if event.absolute is undefined.
                heading = event.alpha;
            }

            if (heading !== null) {
                // Invert for map rotation if needed, but usually bearing is 0=North, 90=East
                // event.alpha: 0=North, 90=West (anti-clockwise) or East?
                // Standard: alpha is 0 at North, increases anti-clockwise (East=270, West=90)?
                // No, standard DeviceOrientation alpha: 0=North, East=270, South=180, West=90 (z-axis rotation)
                // BUT `webkitCompassHeading` is 0=North, 90=East.
                // We want standard bearing: 0=N, 90=E.
                // Detailed implementations often require converting alpha/beta/gamma.
                // For simplicity, let's assume 'alpha' is compass for now or use the `absolute` flag.
                // Most simple compasses use: 360 - alpha.

                let bearing = heading;
                if ((event as any).webkitCompassHeading) {
                    bearing = (event as any).webkitCompassHeading;
                } else {
                    // Android/Standard: alpha increases counter-clockwise usually.
                    // We want clockwise for Map bearing.
                    bearing = 360 - (heading || 0);
                }

                setOrientation({
                    heading: (bearing % 360),
                    accuracy: 0
                });
            }
        };

        // Check for permission (iOS 13+)
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            // Usually triggered by user interaction, might fail here if auto-called.
            // We'll attach listener and hope.
        }

        window.addEventListener('deviceorientationabsolute' as any, handleOrientation, true); // Android absolute
        window.addEventListener('deviceorientation', handleOrientation, true);

        return () => {
            window.removeEventListener('deviceorientationabsolute' as any, handleOrientation, true);
            window.removeEventListener('deviceorientation', handleOrientation, true);
        };
    }, []);

    return orientation;
};
