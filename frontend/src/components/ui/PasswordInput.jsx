import { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * PasswordInput — shadcn Input with a built-in show/hide eye toggle.
 * All standard Input props are forwarded.
 *
 * Usage:
 *   <PasswordInput value={pwd} onChange={(e) => setPwd(e.target.value)} data-testid="login-password-input" />
 */
export const PasswordInput = forwardRef(({ className, "data-testid": testId, ...props }, ref) => {
    const [show, setShow] = useState(false);
    const toggleId = testId ? `${testId}-toggle` : "password-toggle";
    return (
        <div className="relative">
            <Input
                ref={ref}
                type={show ? "text" : "password"}
                className={cn("pr-11", className)}
                data-testid={testId}
                {...props}
            />
            <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                aria-pressed={show}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:rounded-r-xl"
                data-testid={toggleId}
                tabIndex={-1}
            >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
    );
});

PasswordInput.displayName = "PasswordInput";
