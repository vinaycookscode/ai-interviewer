import { AuthFeatures } from "@/components/auth/auth-features";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="min-h-screen w-full flex">
            {/* Left Side - Hero Section */}
            <div className="hidden lg:flex w-[55%] relative bg-[#0f172a] overflow-hidden">
                {/* Aurora Background Effects */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[120px]" />

                {/* Content */}
                <div className="relative z-10 w-full h-full backdrop-blur-3xl">
                    <AuthFeatures />
                </div>
            </div>

            {/* Right Side - Form Section */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background relative">
                {/* Mobile Background Effect */}
                <div className="absolute inset-0 lg:hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-background to-background" />

                <div className="w-full max-w-md relative z-10">
                    {/* Logo Header */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <img
                                src="/logo.png"
                                alt="Get Back To U Logo"
                                className="h-12 w-12 object-contain"
                            />
                            <div className="flex flex-col">
                                <h1 className="text-xl font-bold tracking-tight">
                                    <span className="text-muted-foreground">Get </span>
                                    <span className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">Back</span>
                                    <span className="text-muted-foreground"> To U</span>
                                </h1>
                            </div>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
