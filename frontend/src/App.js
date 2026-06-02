import { useEffect } from "react";
import { Outlet, BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";
import { MarketingShell, AppLayout } from "@/components/layout/AppShell";
import { RequireAuth } from "@/components/layout/RequireAuth";
import "@/App.css";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import PlanWizard from "@/pages/PlanWizard";
import Pricing from "@/pages/Pricing";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import RefundPolicy from "@/pages/RefundPolicy";
import PlanWorkspace from "@/pages/PlanWorkspace";
import BusinessPlan from "@/pages/BusinessPlan";

function RouteScroll() {
    useEffect(() => { window.scrollTo(0, 0); }, []);
    return <Outlet />;
}

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route element={<RouteScroll />}>
                            <Route element={<MarketingShell />}>
                                <Route path="/" element={<Landing />} />
                                <Route path="/pricing" element={<Pricing />} />
                                <Route path="/privacy" element={<Privacy />} />
                                <Route path="/terms" element={<Terms />} />
                                <Route path="/refund-policy" element={<RefundPolicy />} />
                            </Route>
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/plans/new" element={<PlanWizard />} />
                                <Route path="/plans/:planId/business-plan" element={<BusinessPlan />} />
                                <Route path="/plans/:planId/:stepKey" element={<PlanWorkspace />} />
                                <Route path="/plans/:planId" element={<RedirectToFirst />} />
                            </Route>
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Route>
                    </Routes>
                    <Toaster richColors closeButton position="top-right" />
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}

function RedirectToFirst() {
    return <Navigate to="define" replace />;
}
