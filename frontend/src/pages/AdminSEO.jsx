import { useState, useEffect } from 'react'
import { Globe, Search, BarChart2, Save } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import { seoService } from '../services/seoService'
import toast from 'react-hot-toast'

const AdminSEO = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [seoData, setSeoData] = useState({
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    seo_google_analytics_id: '',
    seo_google_site_verification: '',
    seo_google_tag_manager: ''
  })

  useEffect(() => {
    document.title = 'SEO & Référencement - Indebel Admin'
    fetchSeoSettings()
  }, [])

  const fetchSeoSettings = async () => {
    try {
      setLoading(true)
      const res = await seoService.getSeoSettings()
      if (res.data?.data) {
        setSeoData(prev => ({
          ...prev,
          ...(res.data?.data || res.data)
        }))
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des paramètres SEO')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setSeoData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await seoService.updateSeoSettings(seoData)
      toast.success('Paramètres SEO mis à jour')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container-custom py-8">
      <div className="bg-[#082151] rounded-[24px] shadow-md p-6 md:p-8 mb-8 relative overflow-hidden text-white border-0">
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/10 text-white rounded-2xl hidden sm:block">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">SEO & Référencement</h1>
            <p className="text-slate-200 mt-1 max-w-2xl text-sm md:text-base">Gérez les balises méta, les mots-clés et analysez la visibilité de la plateforme.</p>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#2b4eef]/20 to-[#df6422]/20 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none"></div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card title="Balises Méta Principales" className="h-full">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titre de la plateforme (Title)</label>
                <input 
                  type="text" 
                  name="seo_title" 
                  value={seoData.seo_title || ''} 
                  onChange={handleChange} 
                  className="input w-full" 
                  placeholder="ex: Indebel - La plateforme des prestataires et recruteurs en Belgique" 
                />
                <p className="text-xs text-slate-400 mt-1">Sera affiché dans l'onglet du navigateur et les résultats Google (Recommandé: 50-60 caractères).</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Meta Description)</label>
                <textarea 
                  name="seo_description" 
                  value={seoData.seo_description || ''} 
                  onChange={handleChange} 
                  className="input w-full h-24 resize-none" 
                  placeholder="Description concise de votre plateforme..."
                />
                <p className="text-xs text-slate-400 mt-1">Sera affiché sous le titre dans les résultats Google (Recommandé: 150-160 caractères).</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mots-clés (Meta Keywords)</label>
                <input 
                  type="text" 
                  name="seo_keywords" 
                  value={seoData.seo_keywords || ''} 
                  onChange={handleChange} 
                  className="input w-full" 
                  placeholder="prestataires, belgique, indépendants, missions, recruteurs..." 
                />
                <p className="text-xs text-slate-400 mt-1">Séparez les mots-clés par des virgules.</p>
              </div>
            </div>
          </Card>

          <Card title="Intégrations & Outils Tiers" className="h-full">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ID Google Analytics (G-XXXXXXX)</label>
                <input 
                  type="text" 
                  name="seo_google_analytics_id" 
                  value={seoData.seo_google_analytics_id || ''} 
                  onChange={handleChange} 
                  className="input w-full font-mono text-sm" 
                  placeholder="G-XXXXXXX" 
                />
                <p className="text-xs text-slate-400 mt-1">Permet le suivi du trafic sur le site web.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Google Site Verification</label>
                <input 
                  type="text" 
                  name="seo_google_site_verification" 
                  value={seoData.seo_google_site_verification || ''} 
                  onChange={handleChange} 
                  className="input w-full font-mono text-sm" 
                  placeholder="Code de vérification Search Console" 
                />
                <p className="text-xs text-slate-400 mt-1">Balise méta pour valider la propriété auprès de Google Search Console.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Google Tag Manager (GTM-XXXXXXX)</label>
                <input 
                  type="text" 
                  name="seo_google_tag_manager" 
                  value={seoData.seo_google_tag_manager || ''} 
                  onChange={handleChange} 
                  className="input w-full font-mono text-sm" 
                  placeholder="GTM-XXXXXXX" 
                />
                <p className="text-xs text-slate-400 mt-1">Permet de gérer tous vos tags de suivi (Google Ads, Pixel FB, etc.) en un seul endroit.</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {!loading && (
        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg" className="min-w-[200px]">
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Save className="h-5 w-5" /> Enregistrer les paramètres
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

export default AdminSEO
