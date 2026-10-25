import { AlertTriangle } from "lucide-react";

interface FormErrorProps {
    message?: string;
}

export const FormError = ({ message }: FormErrorProps) => {
    if (!message) return null;

    return (
        <div role="alert" className="flex items-start gap-2.5 rounded-2xl bg-sg-danger/10 px-4 py-3 text-sm font-semibold text-sg-danger">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{message}</p>
        </div>
    );
};
