import { useState, useEffect } from 'react'
import { Clock, Euro, Star } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const FreelancerPublishMission = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const canPublish = user?.peut_publier_missions === 1 || user?.role === 'admin'

    useEffect(() => {
        document.title = 'Recruter un sous-traitant - Indebel'
    }, [])

    if (!canPublish) {
        return (
            <div className="py-16 px-4 text-center">
                <Card className="max-w-2xl mx-auto p-12">
                    <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Star className="h-10 w-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Option Réservée aux Membres Premium</h2>
                    <p className="text-gray-600 mb-8 text-lg">
                        Vous devez disposer d'un forfait premium pour pouvoir recruter des sous-traitants sur Indebel.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button onClick={() => navigate('/freelancer/forfaits')} className="px-8">
                            Voir les Forfaits
                        </Button>
                        <Button variant="outline" onClick={() => navigate(-1)}>
                            Retour
                        </Button>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className="py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Recruter un sous-traitant</h1>
                <p className="text-gray-600 font-medium">Externalisez une partie de votre travail en publiant une mission.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
                <Card
                    className="hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-500 bg-blue-50/30"
                    onClick={() => navigate('/freelancer/publish-mission-hourly')}
                >
                    <div className="p-8 text-center">
                        <div className="h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
                            <Clock className="h-10 w-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Mission au Taux Horaire</h3>
                        <p className="text-gray-600 mb-6 text-lg">Paiement basé sur les heures réelles travaillées. Idéal pour les projets évolutifs.</p>
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate('/freelancer/publish-mission-hourly');
                            }}
                        >
                            Choisir ce mode
                        </Button>
                    </div>
                </Card>

                <Card
                    className="hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-emerald-500 bg-emerald-50/30"
                    onClick={() => navigate('/freelancer/publish-mission-fixed')}
                >
                    <div className="p-8 text-center">
                        <div className="h-20 w-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200">
                            <Euro className="h-10 w-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Mission au Forfait Fixe</h3>
                        <p className="text-gray-600 mb-6 text-lg">Un budget global défini pour un périmètre précis. Idéal pour les livrables clairs.</p>
                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate('/freelancer/publish-mission-fixed');
                            }}
                        >
                            Choisir ce mode
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default FreelancerPublishMission
