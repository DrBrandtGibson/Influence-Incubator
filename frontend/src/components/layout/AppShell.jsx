import { Outlet } from "react-router-dom";
import { TopNav } from "./TopNav";
import { Footer } from "./Footer";

export const MarketingShell = () => (
    <div className="min-h-screen flex flex-col grain">
        <TopNav variant="marketing" />
        <main className="flex-1"><Outlet /></main>
        <Footer />
    </div>
);

export const AppLayout = () => (
    <div className="min-h-screen flex flex-col grain bg-background">
        <TopNav variant="app" />
        <main className="flex-1"><Outlet /></main>
    </div>
);
