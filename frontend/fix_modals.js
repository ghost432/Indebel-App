const fs = require('fs');

const path = '/home/thierry-ninja/CascadeProjects/windsurf-project-3/indebel/frontend/src/pages/FreelancerMissions.jsx';
let content = fs.readFileSync(path, 'utf8');

const modalStart = content.indexOf('{/* Modal Quota */}');
const modalEnd = content.lastIndexOf('</Modal>');
const endOfModals = content.indexOf('</div>', modalEnd);

if (modalStart !== -1 && modalEnd !== -1) {
    const modalsStr = content.substring(modalStart, modalEnd + '</Modal>'.length);
    
    // Remove modals from the end
    content = content.substring(0, modalStart) + '{modals}\n    ' + content.substring(endOfModals);
    
    // Create the modals variable
    const modalsVar = `  const modals = (\n    <>\n      ${modalsStr.replace(/\n/g, '\n    ')}\n    </>\n  );\n\n`;
    
    // Insert it before if (loading)
    const loadingIdx = content.indexOf('if (loading)');
    content = content.substring(0, loadingIdx) + modalsVar + content.substring(loadingIdx);
    
    // Also inject it into the selectedMission block
    // We need to find the end of the selectedMission block which ends with:
    //             </div>
    //           </div>
    //         </div>
    //       </div>
    //     );
    //   }
    
    const detailsEndRegex = /(\s+)(<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+\);\s+\}\s+\/\/ Affichage de la liste des missions)/;
    content = content.replace(detailsEndRegex, '$1  {modals}\n$2');
    
    fs.writeFileSync(path, content, 'utf8');
    console.log("Success");
} else {
    console.log("Could not find modals");
}
