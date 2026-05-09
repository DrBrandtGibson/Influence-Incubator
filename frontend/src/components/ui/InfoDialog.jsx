import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

/**
 * InfoDialog — opens a popup with a numbered list of points.
 * Used for Learn More / Key Aspects / Examples popups.
 */
export const InfoDialog = ({ trigger, title, eyebrow, intro, points = [], closing, testIdPrefix }) => (
    <Dialog>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid={`${testIdPrefix}-dialog`}>
            <DialogHeader>
                {eyebrow && <div className="label-eyebrow text-brand-bronze mb-1">{eyebrow}</div>}
                <DialogTitle className="font-serif text-3xl tracking-[-0.02em]">{title}</DialogTitle>
                {intro && <DialogDescription className="text-sm leading-relaxed pt-2">{intro}</DialogDescription>}
            </DialogHeader>
            {points.length > 0 && (
                <>
                    <div className="gold-divider my-2" />
                    <ol className="space-y-4">
                        {points.map((p, i) => (
                            <li key={i} className="flex gap-3">
                                <span className="h-7 w-7 shrink-0 rounded-full bg-brand-gold/15 text-brand-bronze grid place-items-center text-sm font-semibold font-serif">{i + 1}</span>
                                <div>
                                    <div className="font-serif text-lg">{p.title || p.name}</div>
                                    <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{p.body}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </>
            )}
            {closing && <p className="mt-5 text-sm text-muted-foreground leading-relaxed">{closing}</p>}
        </DialogContent>
    </Dialog>
);
