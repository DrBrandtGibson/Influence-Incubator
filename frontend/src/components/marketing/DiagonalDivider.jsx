export const DiagonalDivider = ({ from = "hsl(var(--brand-charcoal))", to = "hsl(var(--background))", className = "" }) => {
    return (
        <div aria-hidden="true" className={`relative w-full overflow-hidden ${className}`} style={{ height: "96px", background: from }}>
            <div
                className="absolute inset-0"
                style={{
                    background: to,
                    clipPath: "polygon(0 100%, 100% 0, 100% 100%, 0 100%)"
                }}
            />
        </div>
    );
};
