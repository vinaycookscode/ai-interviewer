"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface LimitContextType {
    isRateLimited: boolean;
    setRateLimited: (value: boolean) => void;
}

const LimitContext = createContext<LimitContextType | undefined>(undefined);

export function LimitProvider({ children }: { children: ReactNode }) {
    const [isRateLimited, setRateLimited] = useState(false);

    return (
        <LimitContext.Provider value={{ isRateLimited, setRateLimited }}>
            {children}
        </LimitContext.Provider>
    );
}

export function useLimit() {
    const context = useContext(LimitContext);
    if (context === undefined) {
        throw new Error("useLimit must be used within a LimitProvider");
    }
    return context;
}
