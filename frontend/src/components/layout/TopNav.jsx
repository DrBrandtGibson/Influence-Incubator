import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ChevronDown, LogOut, LayoutDashboard, Sparkles, Sun, Moon } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { LOGO_URL } from "@/lib/brand";

export const TopNav = ({ variant = "marketing" }) => {
    const { isAuthenticated, user, profile, signOut, isPro } = useAuth();
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();

    const initials = (profile?.full_name || user?.email || "?").slice(0, 2).toUpperCase();

    return (
        <nav
            data-testid="top-nav"
            className={
                variant === "marketing"
                    ? "sticky top-0 z-50 bg-brand-charcoal/95 backdrop-blur supports-[backdrop-filter]:bg-brand-charcoal/85 border-b border-white/10 text-brand-cream"
                    : "sticky top-0 z-40 bg-background/85 backdrop-blur border-b border-border"
            }
        >
            <div className="container-readable flex items-center justify-between h-16">
                <Link to="/" className="flex items-center gap-2.5 group" data-testid="logo-home-link">
                    <img src={LOGO_URL} alt="Influence Incubator" className="h-9 w-9 rounded-md object-contain bg-black" />
                    <span className="font-serif text-lg font-semibold tracking-tight hidden sm:inline">
                        Influence <span className="text-brand-gold">Incubator</span>
                    </span>
                </Link>

                {variant === "marketing" && (
                    <div className="hidden md:flex items-center gap-7 text-sm">
                        <a href="#formula" className="hover:text-brand-gold transition-colors" data-testid="nav-formula-link">The Formula</a>
                        <a href="#how" className="hover:text-brand-gold transition-colors" data-testid="nav-how-link">How it works</a>
                        <a href="#testimonials" className="hover:text-brand-gold transition-colors" data-testid="nav-testimonials-link">Testimonials</a>
                        <a href="#faq" className="hover:text-brand-gold transition-colors" data-testid="nav-faq-link">FAQ</a>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        aria-label="Toggle theme"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="h-9 w-9 grid place-items-center rounded-full border border-white/15 hover:bg-white/5 transition-colors"
                        data-testid="theme-toggle-button"
                    >
                        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>

                    {!isAuthenticated ? (
                        <>
                            <Button
                                variant="ghost"
                                className={variant === "marketing" ? "text-brand-cream hover:bg-white/5" : ""}
                                onClick={() => navigate("/login")}
                                data-testid="nav-login-button"
                            >
                                Log in
                            </Button>
                            <Button
                                className="cta-red rounded-full px-5"
                                onClick={() => navigate("/signup")}
                                data-testid="nav-signup-cta-button"
                            >
                                Start Free
                            </Button>
                        </>
                    ) : (
                        <>
                            {!isPro && (
                                <Button
                                    className="cta-red rounded-full px-4 hidden sm:inline-flex"
                                    onClick={() => navigate("/pricing")}
                                    data-testid="nav-upgrade-button"
                                >
                                    <Sparkles className="h-4 w-4 mr-1.5" /> Upgrade
                                </Button>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button data-testid="user-menu-button" className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 border border-white/15 hover:bg-white/5 transition-colors">
                                        <div className="h-7 w-7 rounded-full grid place-items-center bg-brand-gold text-brand-charcoal text-xs font-semibold">{initials}</div>
                                        <span className="text-xs hidden sm:inline">{isPro ? "Pro" : "Free"}</span>
                                        <ChevronDown className="h-3.5 w-3.5" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="text-xs font-normal text-muted-foreground">{user?.email}</div>
                                        <div className="text-sm font-medium">{profile?.full_name}</div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => navigate("/dashboard")} data-testid="menu-dashboard-link">
                                        <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                                    </DropdownMenuItem>
                                    {!isPro && (
                                        <DropdownMenuItem onClick={() => navigate("/pricing")} data-testid="menu-upgrade-link">
                                            <Sparkles className="h-4 w-4 mr-2" /> Upgrade to Pro
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={async () => { await signOut(); navigate("/"); }} data-testid="menu-logout-button">
                                        <LogOut className="h-4 w-4 mr-2" /> Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};
