import { CheckCircle } from "lucide-react";

interface FormSuccessProps {
    message?: string;
}

export const FormSuccess = ({ message }: FormSuccessProps) => {
    if (!message) return null;

    return (
        <div role="status" className="flex items-start gap-2.5 rounded-2xl bg-sg-success/10 px-4 py-3 text-sm font-semibold text-sg-success">
            <CheckCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{message}</p>
        </div>
    );
};
