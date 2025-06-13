// frontend/src/components/WakeUpBackend.tsx
import { useState, useEffect } from 'react';

const messages = [
    "Waking the AI Game Master...",
    "Powering up the factories...",
    "Calibrating the market simulators...",
    "Polishing the gadgets...",
    "Almost there..."
];

export const WakeUpBackend = () => {
    const [progress, setProgress] = useState(0);
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        // This timer simulates the progress bar filling up over 30 seconds,
        // which is the maximum cold start time for Render.
        const progressInterval = setInterval(() => {
            setProgress(p => {
                if (p >= 95) { // Don't let it reach 100% on its own
                    clearInterval(progressInterval);
                    return p;
                }
                return p + 1.5;
            });
        }, 450); // Fills up over ~30 seconds

        // This timer cycles through the loading messages
        const messageInterval = setInterval(() => {
            setMessageIndex(i => (i + 1) % messages.length);
        }, 2500); // Change message every 2.5 seconds

        // Cleanup function to stop the timers when the component is unmounted
        return () => {
            clearInterval(progressInterval);
            clearInterval(messageInterval);
        };
    }, []);

    return (
        <div className="w-full max-w-md mx-auto text-center space-y-6">
            <h1 className="text-4xl font-bold text-indigo-700">Connecting to Server</h1>
            
            {/* The animated message */}
            <p className="text-lg text-gray-600 h-8 transition-opacity duration-500">
                {messages[messageIndex]}
            </p>

            {/* The Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                    className="bg-indigo-600 h-4 rounded-full transition-all duration-500 ease-linear"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            
            <p className="text-sm text-gray-500">
                This can take up to 30 seconds on the first visit as the free server spins up.
            </p>
        </div>
    );
};