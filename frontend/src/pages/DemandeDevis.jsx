import { useState, useEffect } from 'react';
import { MapPin, Calendar, Clock, DollarSign, Upload, X, FileText, Send, CheckCircle } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import PublicHeader from '../components/PublicHeader';
import toast from 'react-hot-toast';
import { devisService } from '../services/devisService';
import { belgiumRegions } from '../data/belgiumLocations';

const DemandeDevis = () => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [availableCities, setAvailableCities] = useState([]);
  const [formData, setFormData] = useState({
    type_travaux: '',
    categorie: '',
    description: '',
    urgence: 'normal',
    adresse: '',
    code_postal: '',
    ville: '',
    region: '',
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    date_souhaite: '',
    details_complementaires: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.title = 'Demande de Devis - Indebel';
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await devisService.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      toast.error('Erreur lors du chargement des catégories');
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    if (images.length + files.length > 5) {
      toast.error('Vous ne pouvez télécharger que 5 images maximum');
      return;
    }

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} n'est pas une image`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} est trop volumineux (max 5MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, { name: file.name, data: reader.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRegionChange = (e) => {
    const region = e.target.value;
    setFormData(prev => ({ ...prev, region, ville: '' }));
    setSelectedProvince('');
    setAvailableCities([]);
    if (errors.region) {
      setErrors(prev => ({ ...prev, region: '' }));
    }
  };

  const handleProvinceChange = (e) => {
    const province = e.target.value;
    setSelectedProvince(province);
    setFormData(prev => ({ ...prev, ville: '' }));

    // Mettre à jour les villes disponibles selon la province
    if (formData.region && province) {
      const regionData = belgiumRegions[formData.region];
      if (regionData) {
        if (formData.region === 'Région de Bruxelles-Capitale') {
          setAvailableCities(regionData.communes || []);
        } else {
          setAvailableCities(regionData[province] || []);
        }
      }
    } else {
      setAvailableCities([]);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.type_travaux) newErrors.type_travaux = 'Le type de travaux est requis';
    if (!formData.description) newErrors.description = 'La description est requise';
    if (!formData.adresse) newErrors.adresse = 'L\'adresse est requise';
    if (!formData.code_postal) newErrors.code_postal = 'Le code postal est requis';
    if (!formData.ville) newErrors.ville = 'La ville est requise';
    if (!formData.region) newErrors.region = 'La région est requise';
    if (!formData.prenom) newErrors.prenom = 'Le prénom est requis';
    if (!formData.nom) newErrors.nom = 'Le nom est requis';

    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData.telephone) {
      newErrors.telephone = 'Le téléphone est requis';
    } else if (!/^[0-9+\s()-]{8,}$/.test(formData.telephone)) {
      newErrors.telephone = 'Format de téléphone invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setLoading(true);

    try {
      const demandeData = {
        ...formData,
        fichiers_joints: images.map(img => ({ name: img.name, data: img.data }))
      };

      const response = await devisService.createDemande(demandeData);

      if (response.success) {
        toast.success('✅ Demande envoyée avec succès !');
        setTimeout(() => {
          window.location.href = 'https://indebel.be';
        }, 2000);
      }
    } catch (error) {
      console.error('Erreur soumission:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi de la demande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PublicHeader />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* En-tête */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Demande de Devis
            </h1>
            <p className="text-xl text-gray-600">
              Décrivez votre projet et recevez jusqu'à 5 devis de professionnels qualifiés
            </p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Informations sur le projet */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Détails du projet</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de travaux *
                    </label>
                    <input
                      type="text"
                      name="type_travaux"
                      value={formData.type_travaux}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.type_travaux ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="Ex: Rénovation salle de bain, Installation électrique..."
                    />
                    {errors.type_travaux && <p className="mt-1 text-sm text-red-600">{errors.type_travaux}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catégorie
                    </label>
                    <select
                      name="categorie"
                      value={formData.categorie}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Sélectionnez une catégorie</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.nom}>{cat.nom}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Urgence
                    </label>
                    <select
                      name="urgence"
                      value={formData.urgence}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="normal">Normale</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description du projet *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="5"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.description ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="Décrivez en détail votre projet, vos besoins, vos contraintes..."
                    />
                    {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de début souhaitée
                    </label>
                    <input
                      type="date"
                      name="date_souhaite"
                      value={formData.date_souhaite}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Détails complémentaires
                    </label>
                    <textarea
                      name="details_complementaires"
                      value={formData.details_complementaires}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Surface, étage, accès, contraintes particulières..."
                    />
                  </div>

                  {/* Images */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Photos du projet (max 5)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Cliquez pour ajouter des images</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG jusqu'à 5MB</p>
                      </label>
                    </div>

                    {images.length > 0 && (
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        {images.map((img, index) => (
                          <div key={index} className="relative group">
                            <img src={img.data} alt={img.name} className="w-full h-32 object-cover rounded-lg" />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Localisation */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">📍 Localisation</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse *
                    </label>
                    <input
                      type="text"
                      name="adresse"
                      value={formData.adresse}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.adresse ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="Rue, numéro..."
                    />
                    {errors.adresse && <p className="mt-1 text-sm text-red-600">{errors.adresse}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code postal *
                    </label>
                    <input
                      type="text"
                      name="code_postal"
                      value={formData.code_postal}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.code_postal ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="1000"
                    />
                    {errors.code_postal && <p className="mt-1 text-sm text-red-600">{errors.code_postal}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Région *
                    </label>
                    <select
                      name="region"
                      value={formData.region}
                      onChange={handleRegionChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.region ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                      <option value="">Sélectionnez une région</option>
                      {Object.keys(belgiumRegions).map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                    {errors.region && <p className="mt-1 text-sm text-red-600">{errors.region}</p>}
                  </div>

                  {formData.region && formData.region !== 'Région de Bruxelles-Capitale' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Province
                      </label>
                      <select
                        value={selectedProvince}
                        onChange={handleProvinceChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Sélectionnez une province</option>
                        {Object.keys(belgiumRegions[formData.region] || {}).map(province => (
                          <option key={province} value={province}>{province}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={formData.region === 'Région de Bruxelles-Capitale' ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ville/Commune *
                    </label>
                    {formData.region === 'Région de Bruxelles-Capitale' ? (
                      <select
                        name="ville"
                        value={formData.ville}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.ville ? 'border-red-500' : 'border-gray-300'
                          }`}
                      >
                        <option value="">Sélectionnez une commune</option>
                        {(belgiumRegions['Région de Bruxelles-Capitale']?.communes || []).map(ville => (
                          <option key={ville} value={ville}>{ville}</option>
                        ))}
                      </select>
                    ) : availableCities.length > 0 ? (
                      <select
                        name="ville"
                        value={formData.ville}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.ville ? 'border-red-500' : 'border-gray-300'
                          }`}
                      >
                        <option value="">Sélectionnez une ville</option>
                        {availableCities.map(ville => (
                          <option key={ville} value={ville}>{ville}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        name="ville"
                        value={formData.ville}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.ville ? 'border-red-500' : 'border-gray-300'
                          }`}
                        placeholder="Entrez votre ville"
                      />
                    )}
                    {errors.ville && <p className="mt-1 text-sm text-red-600">{errors.ville}</p>}
                  </div>
                </div>
              </div>

              {/* Coordonnées */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">👤 Vos coordonnées</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.prenom ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.prenom && <p className="mt-1 text-sm text-red-600">{errors.prenom}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.nom ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="votre@email.com"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.telephone ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="+32 123 45 67 89"
                    />
                    {errors.telephone && <p className="mt-1 text-sm text-red-600">{errors.telephone}</p>}
                  </div>
                </div>
              </div>

              {/* Bouton de soumission */}
              <div className="pt-6 border-t">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Envoyer ma demande de devis
                    </>
                  )}
                </Button>
                <p className="text-center text-sm text-gray-500 mt-4">
                  En soumettant ce formulaire, vous acceptez les{' '}
                  <a href="https://indebel.be/cgu-1" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 underline">
                    conditions d'utilisation et politique de confidentialité
                  </a>
                  , d'être contacté par des professionnels
                </p>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
};

export default DemandeDevis;
