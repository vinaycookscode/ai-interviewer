import { RegisterForm } from "@/components/auth/register-form";
import { Suspense } from "react";

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <RegisterForm />
        </Suspense>
    );
}
