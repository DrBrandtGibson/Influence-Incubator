{
  "brand": {
    "name": "The Influence Incubator Formula",
    "attributes": [
      "premium",
      "editorial",
      "cinematic",
      "calm",
      "deliberate",
      "trustworthy",
      "inspiring",
      "coffee-table-book meets premium SaaS"
    ],
    "north_star": "Aesop x Stripe x Masterclass: black cinematic hero moments + cream editorial reading surfaces + gold/bronze detailing + decisive red CTAs."
  },
  "design_tokens": {
    "notes": [
      "Project uses shadcn HSL tokens: hsl(var(--background)) pattern. Define brand tokens in :root and .dark.",
      "Keep gradients decorative only (<=20% viewport). No saturated purple/pink gradients.",
      "Use subtle grain/film texture overlays; avoid AI-illustration look."
    ],
    "css_variables_hsl": {
      "light": {
        "background": "36 43% 96%",
        "foreground": "0 0% 18%",
        "card": "0 0% 100%",
        "card-foreground": "0 0% 18%",
        "popover": "0 0% 100%",
        "popover-foreground": "0 0% 18%",
        "primary": "33 40% 38%",
        "primary-foreground": "36 43% 96%",
        "secondary": "36 28% 92%",
        "secondary-foreground": "0 0% 18%",
        "muted": "36 22% 93%",
        "muted-foreground": "0 0% 40%",
        "accent": "41 55% 62%",
        "accent-foreground": "0 0% 12%",
        "destructive": "358 61% 45%",
        "destructive-foreground": "0 0% 100%",
        "border": "33 18% 84%",
        "input": "33 18% 84%",
        "ring": "41 55% 62%",
        "radius": "0.75rem",
        "chart-1": "33 40% 38%",
        "chart-2": "41 55% 62%",
        "chart-3": "358 61% 45%",
        "chart-4": "120 92% 6%",
        "chart-5": "0 0% 16%",
        "brand-bronze": "33 40% 38%",
        "brand-gold": "41 55% 62%",
        "brand-cta": "358 61% 45%",
        "brand-charcoal": "60 4% 15%",
        "brand-cream": "36 43% 96%",
        "brand-forest": "116 92% 6%",
        "brand-black": "0 0% 0%",
        "brand-white": "0 0% 100%"
      },
      "dark": {
        "background": "60 4% 6%",
        "foreground": "36 43% 96%",
        "card": "60 4% 9%",
        "card-foreground": "36 43% 96%",
        "popover": "60 4% 9%",
        "popover-foreground": "36 43% 96%",
        "primary": "41 55% 62%",
        "primary-foreground": "60 4% 8%",
        "secondary": "60 4% 12%",
        "secondary-foreground": "36 43% 96%",
        "muted": "60 4% 12%",
        "muted-foreground": "36 10% 75%",
        "accent": "33 40% 38%",
        "accent-foreground": "36 43% 96%",
        "destructive": "358 61% 45%",
        "destructive-foreground": "0 0% 100%",
        "border": "60 4% 16%",
        "input": "60 4% 16%",
        "ring": "41 55% 62%",
        "radius": "0.75rem",
        "chart-1": "41 55% 62%",
        "chart-2": "33 40% 38%",
        "chart-3": "358 61% 45%",
        "chart-4": "116 92% 10%",
        "chart-5": "36 43% 96%",
        "brand-bronze": "33 40% 38%",
        "brand-gold": "41 55% 62%",
        "brand-cta": "358 61% 45%",
        "brand-charcoal": "60 4% 15%",
        "brand-cream": "36 43% 96%",
        "brand-forest": "116 92% 6%",
        "brand-black": "0 0% 0%",
        "brand-white": "0 0% 100%"
      },
      "raw_hex_reference": {
        "bronze": "#86653A",
        "gold": "#D2B56A",
        "cta_red": "#C1272D",
        "charcoal": "#292822",
        "body_text": "#2F2F2F",
        "cream": "#FAF7F0",
        "forest": "#031A01"
      },
      "additional_tokens": {
        "shadow": {
          "elev-1": "0 1px 0 hsl(var(--border)), 0 10px 30px rgba(0,0,0,0.06)",
          "elev-2": "0 1px 0 hsl(var(--border)), 0 18px 60px rgba(0,0,0,0.10)",
          "elev-dark": "0 1px 0 rgba(255,255,255,0.06), 0 18px 60px rgba(0,0,0,0.55)"
        },
        "radius": {
          "card": "16px",
          "control": "12px",
          "pill": "999px"
        },
        "spacing": {
          "section_y": "py-16 md:py-24",
          "container": "max-w-6xl",
          "gutter": "px-4 sm:px-6 lg:px-8"
        }
      }
    },
    "global_css_additions": {
      "fonts": {
        "google_fonts": [
          "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Inter:wght@300;400;500;600;700&display=swap"
        ],
        "tailwind_usage": {
          "heading": "font-[\"EB Garamond\"], font-serif",
          "body": "font-[\"Inter\"], font-sans"
        }
      },
      "film_grain_overlay": {
        "implementation": "Add a fixed pseudo-element overlay on body or a top-level Layout wrapper. Use a subtle noise PNG or CSS noise via repeating-radial-gradient.",
        "css_snippet": "body::before { content: \"\"; position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.06; mix-blend-mode: multiply; background-image: url('https://images.unsplash.com/photo-1601662528567-526cd06f6582?auto=format&fit=crop&w=1200&q=60'); background-size: cover; filter: grayscale(1) contrast(1.1); } .dark body::before { opacity: 0.08; mix-blend-mode: overlay; }"
      },
      "selection": {
        "css_snippet": "::selection { background: hsl(var(--brand-gold) / 0.35); color: hsl(var(--foreground)); }"
      }
    }
  },
  "typography": {
    "font_pairing": {
      "headings": "EB Garamond",
      "body": "Inter",
      "editorial_details": "Use EB Garamond italic sparingly for cinematic emphasis (hero line, pull quotes). Use small-caps effect via tracking + uppercase for labels."
    },
    "type_scale_tailwind": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-serif font-semibold tracking-[-0.02em]",
      "h2": "text-base md:text-lg font-sans text-muted-foreground",
      "h3_section": "text-2xl md:text-3xl font-serif font-semibold",
      "h4_card": "text-lg font-serif font-semibold",
      "body": "text-sm md:text-base font-sans leading-relaxed",
      "small": "text-xs font-sans text-muted-foreground",
      "label": "text-xs font-sans uppercase tracking-[0.18em]"
    },
    "editorial_rules": [
      "Never center-align long paragraphs; keep left-aligned for reading flow.",
      "Use generous line-height: body leading-relaxed; long-form outputs leading-[1.8].",
      "Use gold only for headings/highlights/lock icons; avoid gold body paragraphs."
    ]
  },
  "layout_and_grid": {
    "container": "mx-auto max-w-6xl px-4 sm:px-6 lg:px-8",
    "marketing_page_grid": {
      "hero": "grid grid-cols-1 lg:grid-cols-12 gap-10 items-end",
      "feature_bento": "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
      "testimonials": "grid grid-cols-1 md:grid-cols-2 gap-6",
      "faq": "max-w-3xl"
    },
    "app_shell": {
      "desktop": "grid grid-cols-[280px_1fr]",
      "mobile": "sidebar becomes Sheet (drawer) with step navigator; top bar remains sticky"
    },
    "spacing_principle": "Use 2–3x more spacing than typical dashboards. Prefer whitespace over borders; use thin gold separators sparingly."
  },
  "component_path": {
    "shadcn_primary": [
      "/app/frontend/src/components/ui/button.jsx",
      "/app/frontend/src/components/ui/card.jsx",
      "/app/frontend/src/components/ui/input.jsx",
      "/app/frontend/src/components/ui/textarea.jsx",
      "/app/frontend/src/components/ui/tabs.jsx",
      "/app/frontend/src/components/ui/accordion.jsx",
      "/app/frontend/src/components/ui/dialog.jsx",
      "/app/frontend/src/components/ui/sheet.jsx",
      "/app/frontend/src/components/ui/scroll-area.jsx",
      "/app/frontend/src/components/ui/progress.jsx",
      "/app/frontend/src/components/ui/breadcrumb.jsx",
      "/app/frontend/src/components/ui/separator.jsx",
      "/app/frontend/src/components/ui/tooltip.jsx",
      "/app/frontend/src/components/ui/calendar.jsx",
      "/app/frontend/src/components/ui/sonner.jsx"
    ],
    "recommended_new_components": [
      "/app/frontend/src/components/marketing/DiagonalDivider.jsx",
      "/app/frontend/src/components/marketing/CinematicHero.jsx",
      "/app/frontend/src/components/plans/StepNavigator.jsx",
      "/app/frontend/src/components/ai/AIAssistInput.jsx",
      "/app/frontend/src/components/steps/DreamCustomerTradingCard.jsx",
      "/app/frontend/src/components/steps/HerosJourneyWheel.jsx",
      "/app/frontend/src/components/steps/MaslowPyramid.jsx",
      "/app/frontend/src/components/steps/SixNeedsWheel.jsx",
      "/app/frontend/src/components/steps/ContentCalendarDnd.jsx",
      "/app/frontend/src/components/locked/LockedStepPreview.jsx"
    ]
  },
  "components": {
    "buttons": {
      "variants": {
        "primary_cta": {
          "use": "Primary CTA buttons only (Start free, Upgrade, Unlock).",
          "classes": "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] shadow-[var(--shadow-elev-1)] hover:brightness-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]",
          "shape": "rounded-xl px-5 py-3",
          "data_testid_examples": [
            "landing-hero-primary-cta-button",
            "upgrade-modal-primary-cta-button"
          ]
        },
        "secondary_bronze": {
          "use": "Secondary actions (Preview, Learn more).",
          "classes": "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:brightness-[1.05] active:scale-[0.98]",
          "shape": "rounded-xl"
        },
        "ghost_editorial": {
          "use": "Tertiary actions in dense UI (toolbar, inline).",
          "classes": "bg-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent)/0.12)] border border-[hsl(var(--border))]",
          "shape": "rounded-xl"
        }
      },
      "rules": [
        "No gradient buttons (CTA red is solid).",
        "Never use transition: all. Use transition-colors, transition-shadow only.",
        "Add pressed state: active:scale-[0.98] for tactile feel."
      ]
    },
    "inputs": {
      "base": {
        "classes": "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))] rounded-xl focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]",
        "microcopy": "Use label + helper text; avoid placeholder-only forms.",
        "data_testid_examples": [
          "plan-wizard-idea-input",
          "step2-dream-customer-name-input"
        ]
      },
      "textarea": {
        "classes": "min-h-[140px] leading-relaxed",
        "ai_assist": "Every textarea/input in step pages should be wrapped by AIAssistInput."
      }
    },
    "cards": {
      "editorial_card": {
        "use": "Outputs, modules, previews.",
        "classes": "rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-elev-1)]",
        "header": "Use EB Garamond for titles; add thin gold separator via Separator.",
        "divider": "<Separator className=\"bg-[hsl(var(--brand-gold)/0.35)]\" />"
      },
      "dark_cinematic_panel": {
        "use": "Hero sections, locked previews, upgrade prompts.",
        "classes": "rounded-2xl bg-[hsl(var(--brand-charcoal))] text-[hsl(var(--brand-cream))] border border-white/10 shadow-[var(--shadow-elev-dark)]"
      }
    },
    "navigation": {
      "top_nav_marketing": {
        "style": "Bronze nav/panels with gold accents; sticky with subtle blur.",
        "classes": "sticky top-0 z-50 bg-[hsl(var(--primary)/0.92)] backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--primary)/0.78)] border-b border-white/10",
        "items": [
          "Logo left (gold mark + EB Garamond wordmark)",
          "Links: Formula, Examples, Testimonials, FAQ",
          "Right: Login (ghost), Start Free (CTA red)"
        ]
      },
      "breadcrumbs": {
        "use": "In plan workspace top bar.",
        "component": "breadcrumb.jsx",
        "classes": "text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]"
      }
    },
    "tabs": {
      "use": "Sub-modules within each step.",
      "classes": "rounded-xl bg-[hsl(var(--secondary))] p-1",
      "tab_trigger": "data-[state=active]:bg-[hsl(var(--card))] data-[state=active]:shadow-[var(--shadow-elev-1)]"
    },
    "modals_and_sheets": {
      "dialog": {
        "use": "Upgrade prompts, export dialogs, regenerate confirmations.",
        "style": "Editorial: large padding, EB Garamond title, gold divider, CTA red primary.",
        "data_testid_examples": [
          "upgrade-dialog",
          "export-dialog"
        ]
      },
      "sheet": {
        "use": "Mobile step navigator and AI assist history.",
        "style": "Cream background in light mode; charcoal in dark mode."
      }
    }
  },
  "ai_assist_input": {
    "goal": "Universal AI assist on every question: floating 3-button toolbar anchored to the focused field; streaming output with typewriter effect; feels like a premium editor tool.",
    "structure": {
      "wrapper": "relative",
      "field": "shadcn Input/Textarea",
      "toolbar": "absolute right-3 -top-3 flex items-center gap-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-elev-1)] px-1 py-1",
      "buttons": [
        "Answer for me",
        "Expand",
        "Refine"
      ],
      "stream_panel": "Below field: collapsible Card with live tokens; includes Stop button and Copy button."
    },
    "visual_spec": {
      "toolbar_button": {
        "classes": "h-8 px-3 rounded-full text-xs font-sans transition-colors hover:bg-[hsl(var(--accent)/0.12)] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
        "icon": "Use lucide-react Sparkles/Plus/RefreshCcw (no emoji).",
        "data_testid": [
          "ai-assist-answer-button",
          "ai-assist-expand-button",
          "ai-assist-refine-button"
        ]
      },
      "loading_state": {
        "typewriter": "Render streaming text with a subtle caret (opacity pulse).",
        "skeleton": "Use shadcn Skeleton lines inside stream panel."
      },
      "tone": "Gold accents only for active state (e.g., active button border in gold)."
    },
    "interaction": {
      "focus_behavior": "Toolbar appears on focus (fade+slide). On blur, remains for 1.2s then hides unless hovered.",
      "keyboard": "Alt+A / Alt+E / Alt+R triggers actions when field focused.",
      "error": "If AI fails, show Sonner toast + inline error line with data-testid=\"ai-assist-error-text\"."
    }
  },
  "step_navigator": {
    "layout": {
      "desktop": "Left sidebar persistent (280px).",
      "mobile": "Sheet drawer triggered by a 'Steps' button in top bar."
    },
    "visual_spec": {
      "container": "bg-[hsl(var(--primary))] text-[hsl(var(--brand-cream))] border-r border-white/10",
      "step_item": "group flex items-start gap-3 rounded-xl px-3 py-2 hover:bg-white/5",
      "step_number": "h-8 w-8 rounded-full grid place-items-center border border-white/15 text-xs",
      "active": "bg-white/7 border border-[hsl(var(--brand-gold)/0.35)]",
      "completed": "step_number border-[hsl(var(--brand-gold)/0.55)]",
      "locked": "opacity-90",
      "lock_icon": "Gold padlock icon color: #D2B56A (use lucide Lock)."
    },
    "states": {
      "free_steps": "Steps 1–2 show FREE badge (gold outline).",
      "pro_steps": "Steps 3–7 show PRO badge (solid gold text on charcoal pill).",
      "locked_for_free_user": "Disable navigation; clicking opens Upgrade Dialog."
    },
    "data_testid": {
      "step_link": "step-navigator-step-{n}-link",
      "upgrade_trigger": "step-navigator-locked-step-{n}-button",
      "progress": "plan-progress-bar"
    }
  },
  "locked_preview_pages": {
    "pattern": {
      "hero_panel": "Dark cinematic panel with blurred screenshot mock (use Skeleton blocks + blur).",
      "feature_bullets": "3–5 bullets with gold separators.",
      "cta": "CTA red button + secondary 'See what you get' ghost.",
      "trust": "Money-back badge + short testimonial quote."
    },
    "blur_spec": {
      "classes": "relative overflow-hidden rounded-2xl border border-white/10 bg-black/40",
      "overlay": "absolute inset-0 backdrop-blur-md bg-black/35",
      "watermark": "Gold 'PRO' watermark rotated -12deg at 10% opacity"
    },
    "data_testid": {
      "locked-preview-upgrade-button": "locked-preview-upgrade-button",
      "locked-preview-feature-list": "locked-preview-feature-list"
    }
  },
  "step2_dream_customer_trading_card": {
    "format": {
      "print": "A6 portrait (105mm x 148mm) OR 2.5in x 3.5in trading card; export PNG @ 300DPI equivalent (render at 750x1050px minimum).",
      "digital": "Responsive card with same proportions using AspectRatio component."
    },
    "visual_spec": {
      "frame": "Cream base with bronze border + inner gold keyline; subtle foil texture only on border (not content).",
      "top_bar": "Name (EB Garamond) left; 'Niche Type' pill right (forest accent).",
      "art_window": "Top 45%: photo area with rounded corners + thin gold stroke; optional 'holo' overlay at 6% opacity.",
      "stats_row": "HP-style row: Income, Stage, Urgency as mini bars.",
      "two_columns": "Bottom: Demographics (left) / Psychographics (right) with tiny labels and bullet lists.",
      "flavor_text": "1–2 lines italic EB Garamond at bottom as 'signature belief'."
    },
    "implementation": {
      "components": [
        "card.jsx",
        "aspect-ratio.jsx",
        "badge.jsx",
        "separator.jsx",
        "progress.jsx"
      ],
      "export": {
        "library": "html-to-image (recommended) or dom-to-image-more",
        "install": "npm i html-to-image",
        "usage": "const dataUrl = await toPng(ref.current, { pixelRatio: 3, backgroundColor: 'transparent' })"
      }
    },
    "data_testid": {
      "card_root": "dream-customer-trading-card",
      "export_png_button": "dream-customer-export-png-button"
    }
  },
  "step2_interactive_svgs": {
    "maslow_pyramid": {
      "spec": "5-tier pyramid SVG with hover tooltips; each tier clickable to open a Dialog with prompts + AI assist.",
      "colors": "Cream fills with bronze outlines; active tier gets gold outline + subtle glow.",
      "data_testid": {
        "tier": "maslow-tier-{level}-button",
        "dialog": "maslow-tier-dialog"
      }
    },
    "tony_robbins_six_needs_wheel": {
      "spec": "6-segment circular wheel SVG; click segment to select; selected segment shows right-side panel with questions.",
      "colors": "Charcoal base in dark mode; gold segment stroke; forest accent for selected fill at low opacity.",
      "data_testid": {
        "segment": "six-needs-segment-{name}-button",
        "panel": "six-needs-detail-panel"
      }
    }
  },
  "step3_heros_journey_wheel": {
    "spec": {
      "format": "Circular 12-stage SVG wheel with labels around perimeter; center shows selected stage details.",
      "interaction": "Hover highlights segment; click locks selection; keyboard arrow cycles stages.",
      "style": "Gold strokes on charcoal; cream center card; subtle radial shadow."
    },
    "implementation": {
      "svg": {
        "approach": "Generate 12 arcs with polar coordinates; keep text upright using rotate transforms.",
        "stroke": "stroke-[hsl(var(--brand-gold)/0.75)] stroke-[1.5]",
        "active": "fill-[hsl(var(--brand-gold)/0.10)] stroke-[hsl(var(--brand-gold))]"
      },
      "data_testid": {
        "wheel": "heros-journey-wheel",
        "segment": "heros-journey-stage-{index}-button",
        "detail": "heros-journey-stage-detail"
      }
    }
  },
  "step4_content_calendar_dnd": {
    "library": {
      "recommendation": "@dnd-kit/core + @dnd-kit/sortable (lightweight, modern)",
      "install": "npm i @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities",
      "why": "Better control than react-beautiful-dnd; works well with custom calendar grid."
    },
    "calendar_ui": {
      "base": "Use shadcn Calendar for date picking + a custom month grid for drag/drop content cards.",
      "content_card": "Small editorial chips with gold left border; drag handle icon.",
      "empty_state": "Cream card with dashed border + 'Drag ideas here' label."
    },
    "data_testid": {
      "calendar": "content-calendar",
      "day_cell": "content-calendar-day-{yyyy}-{mm}-{dd}",
      "content_item": "content-calendar-item-{id}"
    }
  },
  "marketing_landing_page": {
    "sections": [
      {
        "id": "hero",
        "notes": "Black hero section with gold accents; diagonal divider into cream section.",
        "layout": "Left: headline + subhead + CTAs; Right: cinematic portrait or product mock.",
        "headline": "Marketing Your Extraordinary…",
        "cta": [
          "Start Steps 1–2 Free",
          "Watch how it works"
        ]
      },
      {
        "id": "7-step-preview",
        "notes": "7 cards with FREE/PRO badges; Steps 3–7 show gold lock icon for free users.",
        "layout": "Bento grid; each card has step number, title, 1-line promise."
      },
      {
        "id": "social-proof",
        "notes": "Editorial testimonials with pull-quote styling; gold separators; avoid busy logos."
      },
      {
        "id": "faq",
        "notes": "Accordion; keep answers short; link to refund policy later."
      }
    ],
    "diagonal_dividers": {
      "rule": "Use diagonal dividers between major sections on marketing pages only.",
      "implementation": {
        "css_clip_path": "Use a pseudo-element with clip-path polygon to create diagonal edge.",
        "snippet": ".section-diagonal { position: relative; } .section-diagonal::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 64px; background: inherit; clip-path: polygon(0 0, 100% 60%, 100% 100%, 0 100%); } @media (min-width: 768px){ .section-diagonal::after{ height: 96px; clip-path: polygon(0 0, 100% 45%, 100% 100%, 0 100%);} }",
        "accessibility": "Ensure divider is decorative only (aria-hidden)."
      }
    }
  },
  "motion_and_microinteractions": {
    "library": {
      "framer_motion": {
        "install": "npm i framer-motion",
        "usage": "Use motion.div for section reveals, hover lifts, and dialog transitions. Respect prefers-reduced-motion."
      }
    },
    "principles": [
      "Motion should feel like film editing: fades, gentle slides, subtle scale—never bouncy.",
      "Use 180–240ms for hover transitions; 320–480ms for section entrances.",
      "Avoid animating layout on every render; animate on viewport entry."
    ],
    "recipes": {
      "section_reveal": {
        "variant": "{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } }",
        "usage": "Apply to landing sections and step module cards."
      },
      "card_hover": {
        "behavior": "On hover: translateY(-2px) + shadow elev-2; on active: scale 0.99.",
        "tailwind": "transition-shadow transition-colors hover:shadow-[var(--shadow-elev-2)]"
      },
      "ai_toolbar_appear": {
        "behavior": "Fade+slide from y=6; delay 60ms; hide with 120ms fade.",
        "accessibility": "Disable motion when prefers-reduced-motion."
      },
      "progress_bar": {
        "behavior": "Animate width changes with CSS transition (transition-[width] duration-300 ease-out)."
      }
    }
  },
  "accessibility": {
    "wcag": [
      "Maintain AA contrast: gold text only on charcoal/black; avoid gold on cream for body text.",
      "Focus rings: always visible; use ring token (gold) with offset.",
      "Keyboard navigation: step navigator, wheel segments, and toolbar buttons must be tabbable.",
      "Reduced motion: respect prefers-reduced-motion; provide non-animated fallbacks."
    ],
    "aria": {
      "svg_controls": "All interactive SVG segments must be <button> overlays or role=button with aria-label and keyboard handlers.",
      "dialogs": "Use shadcn Dialog (handles aria)."
    },
    "data_testid_rule": "All interactive and key informational elements MUST include data-testid in kebab-case describing role."
  },
  "image_urls": {
    "hero_editorial_portraits": [
      {
        "url": "https://images.unsplash.com/photo-1563175076-bf4785155115?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
        "description": "Cinematic entrepreneur portrait for landing hero right column (dark, premium)."
      },
      {
        "url": "https://images.unsplash.com/photo-1665224752561-85f4da9a5658?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
        "description": "Alternate hero portrait / testimonial section background crop."
      }
    ],
    "textures": [
      {
        "url": "https://images.unsplash.com/photo-1601662528567-526cd06f6582?auto=format&fit=crop&w=1200&q=60",
        "description": "Subtle paper/grain overlay for light mode backgrounds (very low opacity)."
      },
      {
        "url": "https://images.unsplash.com/photo-1656055450593-5f9fc1e88b65?auto=format&fit=crop&w=1200&q=60",
        "description": "Gold foil texture for trading card border / decorative accents only (mask + low opacity)."
      }
    ]
  },
  "instructions_to_main_agent": [
    "Replace default shadcn tokens in /app/frontend/src/index.css :root and .dark with the HSL values above; keep the same variable names.",
    "Remove/ignore CRA demo styles in App.css (App-header/App-logo) and avoid centering the app container.",
    "Add Google Fonts import for EB Garamond + Inter (index.html or index.css). Apply fonts via Tailwind classes on headings/body wrappers.",
    "Implement DiagonalDivider as a reusable component for marketing sections only; do not use gradients; use clip-path polygon.",
    "Implement AIAssistInput wrapper component in JS (not TSX). Wrap every Input/Textarea in step pages with it.",
    "Implement StepNavigator with FREE/PRO badges and gold lock icons; locked steps open Upgrade Dialog.",
    "Dream Customer Trading Card: build as a printable component with html-to-image export; ensure 300DPI-ish pixelRatio.",
    "Hero’s Journey wheel: implement as SVG with 12 segments; ensure keyboard navigation and data-testid on segments.",
    "Content calendar: use shadcn Calendar for date selection + @dnd-kit for drag/drop content items.",
    "Add framer-motion for section reveals and micro-interactions; respect prefers-reduced-motion.",
    "Ensure every interactive element and key info has data-testid in kebab-case."
  ],
  "appendix_general_ui_ux_design_guidelines": "<General UI UX Design Guidelines>  \n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
