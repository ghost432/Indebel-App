(function() {
  let globalSecteursOptions = '';
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  fetch('/api/secteurs', {
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(r => r.json()).then(j => {
    if (j.success && j.data) {
       globalSecteursOptions = j.data.map(s => `<option value="${s.nom}">${s.nom}</option>`).join('');
    }
  }).catch(() => {});

  const style = document.createElement('style');
  style.textContent = `
    body.hide-native-admin-forms .container-custom:not(#indebel-custom-create):not(#indebel-custom-edit) {
        display: none !important;
    }
  `;
  document.head.appendChild(style);

  const checkFormsInterval = setInterval(() => {
    const path = window.location.pathname;
    
    // Safely wait for the native container to be rendered by React
    const nativeContainer = document.querySelector('.container-custom:not(#indebel-custom-create):not(#indebel-custom-edit)');
    if (!nativeContainer) return;
    
    const parent = nativeContainer.parentNode;
    
    if (!parent) return;

    if (path === '/admin/users/create') {
      document.body.classList.add('hide-native-admin-forms');
      if (!document.getElementById('indebel-custom-create')) {
        
        const container = document.createElement('div');
        container.id = 'indebel-custom-create';
        container.className = 'container-custom py-8';
        container.innerHTML = `
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Créer un utilisateur (Complet)</h1>
            <p class="text-gray-600">Formulaire complet synchronisé avec l'inscription publique.</p>
          </div>
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div class="flex border-b border-gray-200">
              <button id="tab-prestataire" class="flex-1 py-4 px-6 text-center font-medium bg-blue-50 text-blue-700 border-b-2 border-blue-600" onclick="switchRole('freelancer')">Prestataire</button>
              <button id="tab-recruteur" class="flex-1 py-4 px-6 text-center font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors" onclick="switchRole('employer')">Recruteur</button>
            </div>
            <div class="p-8">
              <form id="custom-create-form" onsubmit="handleCustomCreate(event)">
                <input type="hidden" id="role" name="role" value="freelancer">
                
                <!-- Informations de base (Communes) -->
                <h3 class="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Informations de connexion</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                    <input type="text" name="prenom" required class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input type="text" name="nom" required class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input type="email" name="email" required class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                    <input type="password" name="mot_de_passe" required class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                  </div>
                </div>

                <!-- Contact & Localisation -->
                <h3 class="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Contact & Localisation</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Pays *</label>
                    <select name="pays_code" required class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                      <option value="BE">Belgique (+32)</option>
                      <option value="FR">France (+33)</option>
                      <option value="LU">Luxembourg (+352)</option>
                      <option value="CH">Suisse (+41)</option>
                      <option value="CA">Canada (+1)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                    <input type="tel" name="telephone" required class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Adresse complète</label>
                    <input type="text" name="adresse" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                    <input type="text" name="code_postal" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                    <input type="text" name="ville" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                  </div>
                </div>

                <!-- Champs Recruteur uniquement -->
                <div id="fields-recruteur" style="display:none;">
                  <h3 class="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Informations Entreprise</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise (Dénomination) *</label>
                      <input type="text" name="denomination" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Numéro d'entreprise (BCE)</label>
                      <input type="text" name="numero_bce" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Secteur d'activité</label>
                      <select name="secteur_emp" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Sélectionner un secteur</option>
                        ${globalSecteursOptions}
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Taille de l'entreprise</label>
                      <select name="taille_entreprise" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Sélectionner</option>
                        <option value="1-9">1-9 employés</option>
                        <option value="10-49">10-49 employés</option>
                        <option value="50-249">50-249 employés</option>
                        <option value="250+">250+ employés</option>
                      </select>
                    </div>
                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-gray-700 mb-1">Site web</label>
                      <input type="url" name="site_web" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                    </div>
                  </div>
                </div>

                <!-- Champs Prestataire uniquement -->
                <div id="fields-prestataire">
                  <h3 class="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Profil Professionnel</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Métier / Poste *</label>
                      <input type="text" name="poste" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Secteur d'activité</label>
                      <select name="secteur_free" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Sélectionner un secteur</option>
                        ${globalSecteursOptions}
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Années d'expérience</label>
                      <input type="number" name="experience" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                    </div>
                  </div>
                </div>

                <div class="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                  <button type="button" onclick="window.history.back()" class="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">Annuler</button>
                  <button type="submit" id="btn-submit-create" class="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Créer l'utilisateur</button>
                </div>
              </form>
            </div>
          </div>
        `;
        parent.appendChild(container);
      }
    } else {
      const custom = document.getElementById('indebel-custom-create');
      if (custom) {
        custom.remove();
        document.body.classList.remove('hide-native-admin-forms');
      }
    }
  }, 100);

  window.switchRole = function(role) {
    document.getElementById('role').value = role;
    const tabF = document.getElementById('tab-prestataire');
    const tabE = document.getElementById('tab-recruteur');
    const fieldsF = document.getElementById('fields-prestataire');
    const fieldsE = document.getElementById('fields-recruteur');
    
    if (role === 'freelancer') {
      tabF.className = 'flex-1 py-4 px-6 text-center font-medium bg-blue-50 text-blue-700 border-b-2 border-blue-600';
      tabE.className = 'flex-1 py-4 px-6 text-center font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors';
      fieldsF.style.display = 'block';
      fieldsE.style.display = 'none';
      
      document.querySelector('input[name="poste"]').required = true;
      document.querySelector('input[name="denomination"]').required = false;
    } else {
      tabE.className = 'flex-1 py-4 px-6 text-center font-medium bg-blue-50 text-blue-700 border-b-2 border-blue-600';
      tabF.className = 'flex-1 py-4 px-6 text-center font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors';
      fieldsE.style.display = 'block';
      fieldsF.style.display = 'none';
      
      document.querySelector('input[name="poste"]').required = false;
      document.querySelector('input[name="denomination"]').required = true;
    }
  };

  window.handleCustomCreate = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-create');
    btn.disabled = true;
    btn.textContent = 'Création...';
    
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    
    // Process indicatif based on pays_code
    const indicatifs = { 'BE': '+32', 'FR': '+33', 'LU': '+352', 'CH': '+41', 'CA': '+1' };
    data.indicatif = indicatifs[data.pays_code] || '+32';
    
    // Merge conditional fields
    if (data.role === 'freelancer') {
      data.secteur = data.secteur_free;
    } else {
      data.secteur = data.secteur_emp;
    }
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.success) {
        alert('Utilisateur créé avec succès !');
        window.location.href = '/admin/users';
      } else {
        alert('Erreur: ' + json.message);
        btn.disabled = false;
        btn.textContent = 'Créer l\'utilisateur';
      }
    } catch (err) {
      alert('Erreur réseau');
      btn.disabled = false;
      btn.textContent = 'Créer l\'utilisateur';
    }
  };

  // Also handle edit profile pages: /admin/users/:id
  const checkEditInterval = setInterval(async () => {
    const path = window.location.pathname;
    const match = path.match(/^\/admin\/users\/(\d+)$/);
    
    // Safely wait for the native container to be rendered by React
    const nativeContainer = document.querySelector('.container-custom:not(#indebel-custom-create):not(#indebel-custom-edit)');
    if (!nativeContainer) return;
    
    const parent = nativeContainer.parentNode;

    if (match) {
      document.body.classList.add('hide-native-admin-forms');
      const userId = match[1];
      if (!document.getElementById('indebel-custom-edit')) {
        
        const container = document.createElement('div');
        container.id = 'indebel-custom-edit';
        container.className = 'container-custom py-8';
        container.innerHTML = `<div class="text-center py-10"><p>Chargement du profil complet...</p></div>`;
        parent.appendChild(container);

        try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          const res = await fetch(`/api/users/${userId}`, {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const json = await res.json();
          if (json.success && json.data) {
            const user = json.data;
            const isFreelancer = user.role === 'freelancer';
            
            container.innerHTML = `
              <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">Modifier le profil (${isFreelancer ? 'Prestataire' : 'Recruteur'})</h1>
                <p class="text-gray-600">Formulaire complet synchronisé avec la base de données.</p>
              </div>
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div class="p-8">
                  <form id="custom-edit-form" onsubmit="handleCustomEdit(event, ${userId})">
                    <input type="hidden" name="role" value="${user.role}">
                    
                    <h3 class="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Informations de connexion</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                        <input type="text" name="prenom" value="${user.prenom || ''}" required class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                        <input type="text" name="nom" value="${user.nom || ''}" required class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" name="email" value="${user.email || ''}" required class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe (laisser vide pour ne pas changer)</label>
                        <input type="password" name="mot_de_passe" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                      </div>
                    </div>

                    <h3 class="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Contact & Localisation</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                        <select name="pays_code" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                          <option value="BE" ${user.pays_code==='BE'?'selected':''}>Belgique (+32)</option>
                          <option value="FR" ${user.pays_code==='FR'?'selected':''}>France (+33)</option>
                          <option value="LU" ${user.pays_code==='LU'?'selected':''}>Luxembourg (+352)</option>
                          <option value="CH" ${user.pays_code==='CH'?'selected':''}>Suisse (+41)</option>
                          <option value="CA" ${user.pays_code==='CA'?'selected':''}>Canada (+1)</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                        <input type="tel" name="telephone" value="${user.telephone || ''}" required class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                      </div>
                      <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Adresse complète</label>
                        <input type="text" name="adresse" value="${user.adresse || ''}" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                        <input type="text" name="code_postal" value="${user.code_postal || ''}" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                        <input type="text" name="ville" value="${user.ville || ''}" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                      </div>
                    </div>

                    <div style="display: ${isFreelancer ? 'none' : 'block'}">
                      <h3 class="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Informations Entreprise</h3>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Dénomination</label>
                          <input type="text" name="denomination" value="${user.denomination || ''}" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Numéro BCE</label>
                          <input type="text" name="numero_bce" value="${user.numero_bce || ''}" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Secteur d'activité</label>
                          <select name="secteur_emp" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                            <option value="">Sélectionner un secteur</option>
                            ${globalSecteursOptions}
                            ${user.secteur ? `<option value="${user.secteur}" selected>${user.secteur}</option>` : ''}
                          </select>
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Taille de l'entreprise</label>
                          <select name="taille_entreprise" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                            <option value="">Sélectionner</option>
                            <option value="1-9" ${user.taille_entreprise==='1-9'?'selected':''}>1-9 employés</option>
                            <option value="10-49" ${user.taille_entreprise==='10-49'?'selected':''}>10-49 employés</option>
                            <option value="50-249" ${user.taille_entreprise==='50-249'?'selected':''}>50-249 employés</option>
                            <option value="250+" ${user.taille_entreprise==='250+'?'selected':''}>250+ employés</option>
                          </select>
                        </div>
                        <div class="md:col-span-2">
                          <label class="block text-sm font-medium text-gray-700 mb-1">Site web</label>
                          <input type="url" name="site_web" value="${user.site_web || ''}" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        </div>
                      </div>
                    </div>

                    <div style="display: ${isFreelancer ? 'block' : 'none'}">
                      <h3 class="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Profil Professionnel</h3>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Métier / Poste</label>
                          <input type="text" name="poste" value="${user.poste || ''}" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Secteur d'activité</label>
                          <select name="secteur_free" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                            <option value="">Sélectionner un secteur</option>
                            ${globalSecteursOptions}
                            ${user.secteur ? `<option value="${user.secteur}" selected>${user.secteur}</option>` : ''}
                          </select>
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Années d'expérience</label>
                          <input type="number" name="experience" value="${user.experience || ''}" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        </div>
                      </div>
                    </div>

                    <div class="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                      <button type="button" onclick="window.history.back()" class="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">Annuler</button>
                      <button type="submit" id="btn-submit-edit-${userId}" class="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Mettre à jour</button>
                    </div>
                  </form>
                </div>
              </div>
            `;
          } else {
            container.innerHTML = `<div class="text-center py-10 text-red-600">Impossible de charger l'utilisateur.</div>`;
          }
        } catch (err) {
          container.innerHTML = `<div class="text-center py-10 text-red-600">Erreur réseau.</div>`;
        }
      }
    } else {
      const custom = document.getElementById('indebel-custom-edit');
      if (custom) {
        custom.remove();
        document.body.classList.remove('hide-native-admin-forms');
      }
    }
  }, 100);

  window.handleCustomEdit = async function(e, userId) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-edit-' + userId);
    btn.disabled = true;
    btn.textContent = 'Mise à jour...';
    
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    
    // Process indicatif based on pays_code
    const indicatifs = { 'BE': '+32', 'FR': '+33', 'LU': '+352', 'CH': '+41', 'CA': '+1' };
    data.indicatif = indicatifs[data.pays_code] || '+32';
    
    // Merge conditional fields
    if (data.role === 'freelancer') {
      data.secteur = data.secteur_free;
    } else {
      data.secteur = data.secteur_emp;
    }

    if (!data.mot_de_passe) {
      delete data.mot_de_passe; // Don't send empty password if not changed
    }
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('/api/users/' + userId, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.success) {
        alert('Utilisateur mis à jour avec succès !');
        window.location.href = '/admin/users';
      } else {
        alert('Erreur: ' + json.message);
        btn.disabled = false;
        btn.textContent = 'Mettre à jour';
      }
    } catch (err) {
      alert('Erreur réseau');
      btn.disabled = false;
      btn.textContent = 'Mettre à jour';
    }
  };
  
  // NOUVEAU: Fetch users data pour récupérer nom_partenariat
  let allUsersData = [];
  function fetchAllUsersData() {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if(!token) return;
      fetch('/api/users/all', {
          headers: { 'Authorization': 'Bearer ' + token }
      }).then(r => r.json()).then(j => {
          if(j.success && j.data) {
              allUsersData = j.data;
          }
      }).catch(()=>{});
  }

  // Interval pour insérer les données Partenaire
  setInterval(() => {
      if (window.location.pathname === '/admin/users' || window.location.pathname.startsWith('/admin/users')) {
          const currentData = window.indebelAllUsersData || allUsersData;
          if (currentData.length === 0) fetchAllUsersData();
          
          // 1. CARDS / LIST ITEMS
          const emailRegexStrict = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.(com|fr|be|net|org|io|eu|co\.uk|lu|ch|info|biz|co|mail))/i;
          const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
          let textNode;
          while(textNode = walk.nextNode()) {
              const matches = textNode.nodeValue.match(emailRegexStrict);
              if (matches) {
                  const email = matches[0].toLowerCase();
                  const userObj = currentData.find(u => u.email && u.email.toLowerCase() === email);
                  if (userObj) {
                      // Find the card container
                      let card = textNode.parentNode;
                      let actionsContainer = null;
                      while (card && card !== document.body) {
                          // Look for the actions container inside this card level
                          const potentialButtons = card.querySelectorAll('button');
                          if (potentialButtons.length > 0) {
                              // We found the level that contains buttons (the row/card)
                              actionsContainer = potentialButtons[potentialButtons.length - 1].parentNode;
                              break;
                          }
                          card = card.parentNode;
                      }

                      if (actionsContainer && !actionsContainer.closest('[role="dialog"]') && !actionsContainer.closest('.fixed.inset-0.z-50')) {
                          // INJECT PARTENAIRE NAME
                          if (userObj.nom_partenariat && !actionsContainer.querySelector('.partenaire-badge')) {
                              const partSpan = document.createElement('span');
                              partSpan.className = 'partenaire-badge px-2 py-1 ml-2 mr-2 rounded-full text-xs font-medium bg-blue-100 text-blue-800 inline-flex items-center';
                              partSpan.innerHTML = `Créé par: ${userObj.nom_partenariat}`;
                              actionsContainer.insertBefore(partSpan, actionsContainer.firstChild);
                          }

                          // INJECT DELETE BUTTON FOR SUB-ADMINS
                          if (userObj.role === 'admin' && !actionsContainer.querySelector('.delete-subadmin-btn')) {
                              const deleteBtn = document.createElement('button');
                              deleteBtn.className = 'text-red-600 hover:text-red-900 ml-2 p-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors delete-subadmin-btn inline-flex items-center justify-center';
                              deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>';
                              deleteBtn.title = "Supprimer ce compte administrateur";
                              
                              deleteBtn.onclick = async (e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  if (confirm('Voulez-vous vraiment supprimer ce compte administrateur ?')) {
                                      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                                      const res = await fetch('/api/users/' + userObj.id, {
                                          method: 'DELETE',
                                          headers: { 'Authorization': 'Bearer ' + token }
                                      });
                                      if (res.ok) {
                                          if (card) card.style.display = 'none';
                                          alert('Administrateur supprimé avec succès !');
                                      } else {
                                          alert('Erreur lors de la suppression.');
                                      }
                                  }
                              };
                              actionsContainer.appendChild(deleteBtn);
                          }
                      }
                  }
              }
          }
  
          // 2. DIALOG POPUP
          const dialog = document.querySelector('[role="dialog"]') || document.querySelector('.fixed.inset-0.z-50');
          const currentDataDialog = window.indebelAllUsersData || allUsersData;
          if (dialog && currentDataDialog.length > 0) {
              const title = dialog.querySelector('h2, h3');
              if (title && (title.textContent.includes("Détails") || title.textContent.includes("utilisateur"))) {
                  if (!dialog.querySelector('.partenaire-popup-info')) {
                      let email = '';
                      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.(com|fr|be|net|org|io|eu|co\.uk|lu|ch|info|biz|co|mail))/gi;
                      const matches = dialog.textContent.match(emailRegex);
                      if (matches) {
                          const uniqueEmails = [...new Set(matches.map(e => e.toLowerCase()))];
                          if (uniqueEmails.length > 0) email = uniqueEmails[0];
                      }
  
                      if (email) {
                          const user = currentDataDialog.find(u => u.email && u.email.toLowerCase() === email);
                          if (user && user.nom_partenariat) {
                              const infoDiv = document.createElement('div');
                              infoDiv.className = 'mt-4 mb-4 p-3 bg-blue-50 rounded-lg partenaire-popup-info border border-blue-200 shadow-sm w-full';
                              infoDiv.innerHTML = `<div class="flex items-center"><svg class="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg><p class="text-sm font-medium text-blue-900">Ce profil a été créé par le partenaire : <span class="font-bold text-blue-700">${user.nom_partenariat}</span></p></div>`;
                              
                              title.parentNode.insertBefore(infoDiv, title.nextSibling);
                          } else {
                              const infoDiv = document.createElement('div');
                              infoDiv.className = 'partenaire-popup-info hidden';
                              title.parentNode.appendChild(infoDiv);
                          }
                      }
                  }
              }
          }
      }
  }, 500);

})();

  // NOUVEAU: Injection du champ limite_devis_ia dans le formulaire de forfait
  const normalizeForfaitName = (value) => String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

  const normalizeForfaitLimit = (value) => {
      if (value === undefined || value === null || value === '') return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : null;
  };

  const getAuthToken = () => localStorage.getItem('token') || sessionStorage.getItem('token') || '';

  async function refreshForfaitsData(type) {
      try {
          const suffix = type ? ('?type_utilisateur=' + encodeURIComponent(type) + '&_=' + Date.now()) : ('?_=' + Date.now());
          const res = await fetch('/api/forfaits' + suffix, {
              headers: { 'Authorization': 'Bearer ' + getAuthToken(), 'Accept': 'application/json' },
              cache: 'no-store'
          });
          const json = await res.json();
          if (json.success && json.data) {
              window.indebelForfaitsData = Array.isArray(json.data) ? json.data : [json.data];
              return window.indebelForfaitsData;
          }
      } catch(e) {}
      return window.indebelForfaitsData || [];
  }

  function detectForfaitTypeFromModal(modal) {
      const typeField = modal && modal.querySelector('[name="type_utilisateur"]');
      const fieldValue = typeField && (typeField.value || typeField.getAttribute('value'));
      if (fieldValue) return fieldValue;

      const selectedText = typeField && typeField.selectedOptions && typeField.selectedOptions[0]
          ? typeField.selectedOptions[0].textContent
          : '';
      const text = normalizeForfaitName(`${selectedText} ${modal ? modal.textContent : ''}`);
      if (/freelancer|prestataire/.test(text)) return 'freelancer';
      if (/employer|recruteur|employeur|entreprise/.test(text)) return 'employer';
      return '';
  }

  function findForfaitForModal(modal, nameInput) {
      const forfaits = Array.isArray(window.indebelForfaitsData) ? window.indebelForfaitsData : [];
      const name = normalizeForfaitName(nameInput && nameInput.value);
      const type = detectForfaitTypeFromModal(modal);
      if (name) {
          const exact = forfaits.find(f =>
              normalizeForfaitName(f.nom) === name &&
              (!type || f.type_utilisateur === type || f.type_utilisateur === 'les_deux')
          ) || forfaits.find(f => normalizeForfaitName(f.nom) === name && normalizeForfaitLimit(f.limite_devis_ia) !== null)
            || forfaits.find(f => normalizeForfaitName(f.nom) === name);
          if (exact) return exact;
      }

      const modalText = normalizeForfaitName(modal && modal.textContent);
      return forfaits.find(f => {
          const forfaitName = normalizeForfaitName(f.nom);
          return forfaitName && modalText.includes(forfaitName);
      }) || null;
  }

  function applyIaLimitToField(forfaitData, toggle, wrapper, input) {
      if (!forfaitData) return false;
      const limit = normalizeForfaitLimit(forfaitData.limite_devis_ia);
      toggle.dataset.initialized = 'true';
      toggle.dataset.forfaitId = forfaitData.id || '';
      toggle.dataset.forfaitName = forfaitData.nom || '';

      if (limit === 0) {
          toggle.checked = false;
          wrapper.style.display = 'none';
          input.value = '';
          return true;
      }

      toggle.checked = true;
      wrapper.style.display = 'block';
      input.value = limit === null ? '' : String(limit);
      return true;
  }

  setInterval(() => {
      if (window.location.pathname === '/admin/forfaits') {
          // Rechercher spécifiquement le conteneur du modal ouvert
          const modal = document.querySelector('.fixed.inset-0.z-50');
          if (modal) {
              const elements = Array.from(modal.querySelectorAll('span, label, p'));
              const devisLabel = elements.find(el => {
                  const text = el.textContent.trim().toLowerCase();
                  return text === 'voir les devis' || text === 'peut voir les devis';
              });
              
              if (devisLabel && !modal.querySelector('#ia-toggle-container')) {
                  const nameInput = modal.querySelector('input[name="nom"], input[placeholder*="Nom"]');
                  
                  const iaContainer = document.createElement('div');
                  iaContainer.id = 'ia-toggle-container';
                  iaContainer.className = 'col-span-1 md:col-span-2 mb-4 mt-4 w-full p-4 border border-gray-200 rounded-lg bg-blue-50';
                  
                  iaContainer.innerHTML = `
                      <label class="flex items-center space-x-3 cursor-pointer mb-3">
                          <input type="checkbox" id="ia-toggle" class="h-5 w-5 text-primary-600 rounded border-gray-300">
                          <span class="text-sm font-bold text-gray-900">Peut générer des devis par IA</span>
                      </label>
                      <div id="ia-quota-wrapper" style="display: none;">
                          <label class="block text-sm font-medium text-gray-700 mb-1">Quota IA mensuel (laisser vide = illimité)</label>
                          <input type="number" name="limite_devis_ia" min="1" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white" placeholder="Ex: 50">
                          <p class="text-xs text-gray-500 mt-1 text-left">Bloque la génération IA au-delà de cette limite.</p>
                      </div>
                  `;
                  
                  // Trouver le FORM à l'intérieur de la boîte blanche du modal
                  // Structure: modal > div.flex > div.bg-white.rounded-lg > div.bg-white.px-4 > div.mt-2 > FORM.space-y-4
                  const formInModal = modal.querySelector('form') || modal.querySelector('.space-y-4');
                  
                  if (formInModal) {
                      // Le label "Voir les devis" est dans un div.grid > div.rounded-lg.border-indigo
                      // On veut insérer notre bloc APRÈS le div.grid qui contient "Voir les devis"
                      const gridContainer = devisLabel.closest('.grid.grid-cols-2') || devisLabel.closest('.grid') || devisLabel.parentNode.parentNode;
                      
                      if (gridContainer && formInModal.contains(gridContainer)) {
                          // Insérer juste après le grid container dans le form
                          gridContainer.parentNode.insertBefore(iaContainer, gridContainer.nextSibling);
                      } else {
                          // Fallback: insérer à la fin du formulaire
                          formInModal.appendChild(iaContainer);
                      }
                  }
                  
                  // Gérer le toggle
                  const toggle = iaContainer.querySelector('#ia-toggle');
                  const wrapper = iaContainer.querySelector('#ia-quota-wrapper');
                  const input = iaContainer.querySelector('input[name="limite_devis_ia"]');
                  
                  toggle.addEventListener('change', (e) => {
                      if (e.target.checked) {
                          wrapper.style.display = 'block';
                      } else {
                          wrapper.style.display = 'none';
                          input.value = '';
                      }
                  });

                  // Gérer la mise à jour asynchrone des valeurs initiales
                  const checkInitialValue = async () => {
                      if (!toggle.dataset.initialized && nameInput && nameInput.value) {
                          await refreshForfaitsData(detectForfaitTypeFromModal(modal));
                          const forfaitData = findForfaitForModal(modal, nameInput);
                          if (applyIaLimitToField(forfaitData, toggle, wrapper, input)) return;
                          await refreshForfaitsData(detectForfaitTypeFromModal(modal));
                          applyIaLimitToField(findForfaitForModal(modal, nameInput), toggle, wrapper, input);
                      }
                  };

                  if (nameInput) {
                      nameInput.addEventListener('input', checkInitialValue);
                      const valInterval = setInterval(checkInitialValue, 300);
                      
                      // Nettoyer l'intervalle si le modal est fermé
                      const observer = new MutationObserver(() => {
                          if (!document.body.contains(iaContainer)) {
                              clearInterval(valInterval);
                              observer.disconnect();
                          }
                      });
                      observer.observe(document.body, { childList: true, subtree: true });
                  }
              }
          }
      }
      
      // NOUVEAU: Injection du lien "Devis postulés par IA" dans la sidebar admin
      if (window.location.pathname.startsWith('/admin/')) {
          const asideLinks = document.querySelectorAll('aside a');
          let hasDevisIA = false;
          let usersLink = null;
          let missionsLink = null;

          asideLinks.forEach(a => {
              if (a.textContent.includes('Devis postulés par IA')) {
                  hasDevisIA = true;
                  a.style.display = 'flex'; // Forcer l'affichage
              }
              if (a.getAttribute('href') === '/admin/users') usersLink = a;
              if (a.getAttribute('href') === '/admin/missions-prestataires') missionsLink = a;
          });

          // Injecter après le lien Utilisateurs s'il n'existe pas
          if (!hasDevisIA && (usersLink || missionsLink)) {
              const refLink = usersLink || missionsLink;
              // On essaie de cloner le lien parent pour garder la même structure (li ou a)
              const containerToClone = refLink.tagName === 'A' ? refLink : refLink.closest('li');
              if (containerToClone) {
                  const newLink = containerToClone.cloneNode(true);
                  const aTag = newLink.tagName === 'A' ? newLink : newLink.querySelector('a');
                  if (aTag) {
                      aTag.setAttribute('href', '/admin/devis-ia');
                      const textSpan = aTag.querySelector('span');
                      if (textSpan) textSpan.textContent = 'Devis postulés par IA';
                      // S'assurer que le style est correct
                      aTag.style.display = 'flex';
                  }
                  containerToClone.parentNode.insertBefore(newLink, containerToClone.nextSibling);
              }
          }
      }
      
      // NOUVEAU: Affichage de la limite IA sur les cartes de forfaits
      if (window.location.pathname === '/admin/forfaits' || window.location.pathname === '/employer/forfaits') {
          if (!window.indebelForfaitsData) {
              refreshForfaitsData();
              return;
          }
          if (window.indebelForfaitsData) {
              const cards = document.querySelectorAll('div.bg-white.rounded-2xl, div.bg-white.shadow-sm, div.border');
              cards.forEach(card => {
                  const titleEl = card.querySelector('h2, h3');
                  if (titleEl) {
                      const title = titleEl.textContent.trim().toLowerCase();
                      const forfaitData = window.indebelForfaitsData.find(f => normalizeForfaitName(f.nom) === normalizeForfaitName(title));
                      if (forfaitData) {
                          // Trouver la liste (ul) des fonctionnalités
                          const ul = card.querySelector('ul');
                          if (ul && !ul.querySelector('.ia-limit-injected')) {
                              const li = document.createElement('li');
                              li.className = 'flex items-center text-sm text-gray-600 ia-limit-injected';
                              let limitText = 'Devis IA illimités';
                              const iaLimit = normalizeForfaitLimit(forfaitData.limite_devis_ia);
                              if (iaLimit === 0) {
                                  limitText = 'Devis IA non autorisés';
                              } else if (iaLimit !== null) {
                                  limitText = `Max ${iaLimit} devis IA / mois`;
                              }
                              
                              li.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 ${iaLimit === 0 ? 'text-gray-400' : 'text-primary-500'} mr-2 shrink-0"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                <span class="${iaLimit === 0 ? 'text-gray-400 line-through' : 'font-medium text-gray-700'}">${limitText}</span>
                              `;
                              ul.appendChild(li);
                          }
                      }
                  }
              });
          }
      }
  }, 1000);
