"use client";

import { motion } from "framer-motion";

export const ProfileHeaderAnimation = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={className}
        >
            {children}
        </motion.div>
    );
};
