import { useEffect, useState } from 'react';
import labelService from '../services/labelService';

const LabelBadge = ({ userId, size = 'md', className = '', forceShow = false }) => {
  const [hasLabel, setHasLabel] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLabel();
  }, [userId]);

  const checkLabel = async () => {
    try {
      console.log('🏷️ LabelBadge: Vérification du label pour userId:', userId);
      const response = await labelService.getStatutLabel(userId);
      console.log('🏷️ LabelBadge: Réponse API:', response.data);
      setHasLabel(response.data.hasLabel);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const shouldShow = forceShow || (!loading && hasLabel);

  console.log('🏷️ LabelBadge: État - loading:', loading, 'hasLabel:', hasLabel, 'shouldShow:', shouldShow);

  if (!shouldShow) return null;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8'
  };

  return (
    <img
      src="/label.png"
      alt="Label Indebel"
      className={`inline-block ${sizeClasses[size]} ${className}`}
      title="Label Indebel - Professionnel Certifié"
      onError={(e) => {
        console.error('🏷️ LabelBadge: Erreur chargement image label.png');
        e.target.style.display = 'none';
      }}
      onLoad={() => {
        console.log('🏷️ LabelBadge: Image label.png chargée avec succès');
      }}
    />
  );
};

export default LabelBadge;
