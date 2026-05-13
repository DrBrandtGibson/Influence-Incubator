import { useState } from "react";
import { Download, FileText, FileType2, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authedFetch } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Defer revocation to allow click navigation to start
    setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function safeName(title, ext) {
    const s = (title || "Plan").replace(/[^a-zA-Z0-9 _-]+/g, "_").trim().replace(/\s+/g, "_").slice(0, 80);
    return `${s || "Plan"}.${ext}`;
}

export function ExportMenu({ planId, planTitle }) {
    const { isPro } = useAuth();
    const navigate = useNavigate();
    const [busy, setBusy] = useState(null); // "pdf" | "docx" | null

    async function handleExport(kind) {
        if (busy) return;
        setBusy(kind);
        const ext = kind === "pdf" ? "pdf" : "docx";
        try {
            const res = await authedFetch(`/plans/${planId}/export.${ext}`, { method: "GET" });
            if (!res.ok) {
                if (res.status === 402) {
                    toast.error("Word export is a Pro feature.", {
                        description: "Upgrade to download your full plan as .docx.",
                        action: { label: "Upgrade", onClick: () => navigate("/pricing") },
                    });
                    return;
                }
                if (res.status === 404) {
                    toast.error("Plan not found.");
                    return;
                }
                if (res.status === 401) {
                    toast.error("Please sign in again to export.");
                    return;
                }
                const text = await res.text().catch(() => "");
                throw new Error(text || `Export failed (${res.status}).`);
            }
            const blob = await res.blob();
            if (!blob || blob.size === 0) {
                throw new Error("Export was empty.");
            }
            downloadBlob(blob, safeName(planTitle, ext));
            toast.success(kind === "pdf" ? "PDF downloaded" : "Word document downloaded", {
                description: isPro ? "Full Pro export saved to your downloads." : "Free preview includes watermark.",
            });
        } catch (e) {
            toast.error("Could not export your plan.", { description: e.message });
        } finally {
            setBusy(null);
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 border-brand-bronze/40 text-brand-bronze hover:bg-brand-bronze/10 hover:text-brand-bronze"
                    data-testid="export-menu-trigger"
                    disabled={!!busy}
                >
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    <span className="hidden sm:inline">Export</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="text-xs uppercase tracking-wide text-brand-bronze">
                    Download your plan
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => handleExport("pdf")}
                    disabled={!!busy}
                    className="cursor-pointer gap-2"
                    data-testid="export-pdf-option"
                >
                    <FileText className="h-4 w-4 text-brand-bronze" />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">PDF</span>
                        <span className="text-[11px] text-muted-foreground">
                            {isPro ? "Full plan, clean format" : "Free preview · watermarked"}
                        </span>
                    </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleExport("docx")}
                    disabled={!!busy}
                    className="cursor-pointer gap-2"
                    data-testid="export-docx-option"
                >
                    <FileType2 className="h-4 w-4 text-brand-bronze" />
                    <div className="flex flex-1 flex-col">
                        <span className="text-sm font-medium flex items-center gap-1.5">
                            Word (.docx)
                            {!isPro && <Lock className="h-3 w-3 text-brand-bronze" />}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                            {isPro ? "Editable in Microsoft Word / Google Docs" : "Pro only · upgrade to enable"}
                        </span>
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default ExportMenu;
