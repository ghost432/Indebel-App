from pathlib import Path

root = Path("/var/www/vhosts/indebel.be")

widget = root / "httpdocs/public/js/devis-widget.js"
s = widget.read_text()
start = s.find("    function getFirstImage(fichiers) {")
if start != -1:
    end = s.find("\n    function createCard", start)
    if end == -1:
        raise SystemExit("createCard marker not found")
    s = s[:start] + s[end + 1:]
s = s.replace(
    """        const image = getFirstImage(devis.fichiers_joints);
        const imageSrc = image && (image.data || image.url || image.src);

        return `
            <article class="devis-card" onclick="window.open('${detailUrl}', '_blank')" role="button" tabindex="0" aria-label="${devis.type_travaux} - ${location}">
                ${imageSrc ? `
                <div class="devis-card-media">
                    <img src="${imageSrc}" alt="Photo du projet ${devis.type_travaux || 'devis'}" loading="lazy">
                </div>` : ''}
                <div class="devis-card-header">""",
    """        return `
            <article class="devis-card" onclick="window.open('${detailUrl}', '_blank')" role="button" tabindex="0" aria-label="${devis.type_travaux} - ${location}">
                <div class="devis-card-header">""",
)
s = s.replace(
    """                    <svg width="14" height="14" fill="none" stroke="#044CF3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>""",
    """                    <svg class="devis-card-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#044CF3" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>""",
)
widget.write_text(s)

page = root / "httpdocs/public/particulier.html"
s = page.read_text()
s = s.replace(
    """        .devis-card-media {
            aspect-ratio: 16 / 9;
            background: #EAF3FF;
            overflow: hidden;
        }
        .devis-card-media img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }
""",
    "",
)
s = s.replace(
    """        .devis-card-date {
            font-size: 0.8rem;
            color: #475569;
            font-style: normal;
            font-weight: 700;
            line-height: 1.35;
        }
""",
    """        .devis-card-date {
            font-size: 0.8rem;
            color: #475569;
            font-style: normal;
            font-weight: 700;
            line-height: 1.35;
            min-width: 0;
        }
        .devis-card-arrow {
            flex: 0 0 22px;
            width: 22px;
            height: 22px;
            display: block;
        }
""",
)
s = s.replace('js/devis-widget.js?v=2026061223', 'js/devis-widget.js?v=2026061224')
page.write_text(s)
