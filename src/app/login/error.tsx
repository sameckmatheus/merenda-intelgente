'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Algo deu errado!</h2>
            <p className="text-slate-600 mb-6 bg-red-100 p-4 rounded text-left font-mono text-sm max-w-lg overflow-auto">
                {error.message || JSON.stringify(error)}
            </p>
            <Button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
            >
                Tentar novamente
            </Button>
        </div>
    );
}
