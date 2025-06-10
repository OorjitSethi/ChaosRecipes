// frontend/src/components/GameSkeleton.tsx

const SkeletonPanel = () => (
    <div className="bg-gray-100 p-6 rounded-lg border border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-6"></div>
        <div className="space-y-4">
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
    </div>
);

export const GameSkeleton = () => {
    return (
        <div className="w-full space-y-6">
            {/* Skeleton Header */}
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 animate-pulse flex justify-between items-center">
                <div>
                    <div className="h-7 bg-gray-300 rounded w-48 mb-2"></div>
                    <div className="h-5 bg-gray-300 rounded w-32"></div>
                </div>
                <div className="h-12 bg-gray-300 rounded-lg w-32"></div>
            </div>

            {/* Skeleton Main Content */}
            <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SkeletonPanel />
                    <SkeletonPanel />
                    <SkeletonPanel />
                    <SkeletonPanel />
                </div>
                <div className="lg:col-span-1">
                    <SkeletonPanel />
                </div>
            </main>
        </div>
    );
};