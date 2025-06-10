// frontend/src/components/TutorialPopup.tsx

interface Props {
    onClose: () => void; // A function to call when the user wants to close the popup
}

// A small, reusable component for section headings
const SectionHeader = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-xl font-bold text-indigo-700 mt-6 mb-2 border-b border-indigo-200 pb-1">
        {children}
    </h3>
);

export const TutorialPopup = ({ onClose }: Props) => {
    return (
        // The semi-transparent backdrop
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            {/* The main popup panel */}
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-2xl max-w-2xl w-full flex flex-col relative" style={{maxHeight: '90vh'}}>
                <h2 className="text-3xl sm:text-4xl font-bold text-center text-indigo-800 mb-4">
                    How to Play: Recipe for Chaos
                </h2>
                
                {/* Close button positioned at the top right */}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8">
                        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                </button>

                {/* Scrollable content area */}
                <div className="overflow-y-auto pr-4 text-gray-800 text-lg leading-relaxed">
                    <p className="text-center italic text-gray-600">The goal is simple: be the first to build your secret gadget. The path is chaos.</p>
                    
                    <SectionHeader>The Objective</SectionHeader>
                    <p>
                        At the start of the game, you are secretly assigned a unique <strong>Gadget</strong> to build. Your goal is displayed in your Player Info panel. To build it, you must first craft its two required <strong>Complex Components</strong>.
                    </p>

                    <SectionHeader>The Core Loop</SectionHeader>
                    <p>
                        Each turn, you can perform actions like buying, selling, crafting, and trading. When you are done, click <strong>End Turn</strong>. The next turn will only begin once all players are ready. But don't take too long—a timer deducts coins from players who are still "thinking"!
                    </p>

                    <SectionHeader>The Market & Crafting</SectionHeader>
                    <ul className="list-disc list-inside space-y-2">
                        <li><strong>Base Ingredients:</strong> Carbon, Silicon, and Polymer can be bought from or sold to the central market.</li>
                        <li><strong>Complex Components:</strong> Items like Microchips and Casings cannot be bought. You must craft them using Base Ingredients, as shown in the Crafting panel.</li>
                        <li><strong>The AI Game Master:</strong> The market is alive! Each turn, an AI introduces events that can dramatically change prices or crafting recipes. An event that raises prices might last for several turns before expiring.</li>
                    </ul>

                    <SectionHeader>Trading</SectionHeader>
                    <p>
                        The market isn't your only option. Use the <strong>Trading Post</strong> to propose direct trades with other players. This is essential for getting what you need when the market is unfavorable or a resource is scarce. You can offer any combination of items and coins.
                    </p>

                    <SectionHeader>Winning the Game</SectionHeader>
                    <p>
                        Once you have both required Complex Components in your inventory, click the big <strong>BUILD!</strong> button in the Crafting panel. The first player to do so wins the game.
                    </p>
                </div>
                
                <div className="pt-6 text-center">
                     <button 
                        onClick={onClose}
                        className="px-8 py-3 font-bold text-white rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors"
                    >
                        Got It!
                    </button>
                </div>
            </div>
        </div>
    );
};