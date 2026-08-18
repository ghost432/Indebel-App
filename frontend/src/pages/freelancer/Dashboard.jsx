import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Clock, CheckCircle, MessageSquare } from 'lucide-react';
import Card from '../../components/Card';
import FreelancerLayout from '../../components/layout/FreelancerLayout';

const Dashboard = () => {
  // Données factices pour le tableau de bord
  const stats = [
    { name: 'Missions en cours', value: '3', icon: Briefcase, change: '+12%', changeType: 'increase' },
    { name: 'Heures travaillées', value: '24h', icon: Clock, change: '+5%', changeType: 'increase' },
    { name: 'Projets terminés', value: '12', icon: CheckCircle, change: '+8%', changeType: 'increase' },
    { name: 'Messages non lus', value: '5', icon: MessageSquare, change: '-2%', changeType: 'decrease' },
  ];

  const recentMissions = [
    { id: 1, title: 'Développement site e-commerce', client: 'Entreprise ABC', status: 'En cours', progress: 75 },
    { id: 2, title: 'Refonte UI/UX', client: 'Startup XYZ', status: 'En attente', progress: 0 },
    { id: 3, title: 'Application mobile', client: 'Société 123', status: 'Terminé', progress: 100 },
  ];

  return (
    <FreelancerLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="mt-1 text-sm text-gray-500">
            Bienvenue sur votre espace Freelancer. Consultez vos statistiques et vos missions en cours.
          </p>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <div className="flex items-baseline mt-1">
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <p className={`ml-2 text-sm font-medium ${
                      stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-primary-50">
                  <stat.icon className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Missions récentes */}
        <Card className="overflow-hidden
```
