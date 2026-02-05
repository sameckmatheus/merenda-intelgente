"use client";

import { SchoolNav } from "@/components/school-nav";

export default function EscolaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <SchoolNav />
            {children}
        </>
    );
}
