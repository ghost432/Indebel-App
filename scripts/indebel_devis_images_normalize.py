from pathlib import Path


helper = """
const normalizeDevisFiles = (demande) => {
  if (!demande) return demande;
  const isEmpty = value => !value || value === '[]';
  if (isEmpty(demande.fichiers_joints) && !isEmpty(demande.images)) {
    demande.fichiers_joints = demande.images;
  }
  return demande;
};
"""

devis = Path("/var/www/vhosts/indebel.be/pro.indebel.be/api/controllers/devisController.js")
s = devis.read_text()
if "const normalizeDevisFiles =" not in s:
    s = s.replace("const { sendEmail } = require('../config/email');\n", "const { sendEmail } = require('../config/email');\n" + helper)
s = s.replace(
    """        ...demandes[0],
        devis_soumis: devisSoumis""",
    """        ...normalizeDevisFiles(demandes[0]),
        devis_soumis: devisSoumis""",
)
devis.write_text(s)

soumis = Path("/var/www/vhosts/indebel.be/pro.indebel.be/api/controllers/devisSoumisController.js")
s = soumis.read_text()
if "const normalizeDevisFiles =" not in s:
    s = s.replace("const { sendEmail } = require('../config/email');\n", "const { sendEmail } = require('../config/email');\n" + helper)
s = s.replace(
    """      data: demandes[0]""",
    """      data: normalizeDevisFiles(demandes[0])""",
)
soumis.write_text(s)
