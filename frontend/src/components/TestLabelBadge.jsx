import React from 'react';
import LabelBadge from './LabelBadge';

const TestLabelBadge = () => {
  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold">Test LabelBadge</h2>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Différentes tailles:</h3>
        <div className="flex items-center space-x-4">
          <LabelBadge userId={8} size="sm" />
          <span>Small</span>
        </div>
        <div className="flex items-center space-x-4">
          <LabelBadge userId={8} size="md" />
          <span>Medium</span>
        </div>
        <div className="flex items-center space-x-4">
          <LabelBadge userId={8} size="lg" />
          <span>Large</span>
        </div>
        <div className="flex items-center space-x-4">
          <LabelBadge userId={8} size="xl" />
          <span>Extra Large</span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Test avec utilisateur sans label:</h3>
        <div className="flex items-center space-x-4">
          <LabelBadge userId={1} size="md" />
          <span>Admin (devrait avoir le badge en mode dev)</span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Test forcé:</h3>
        <div className="flex items-center space-x-4">
          <LabelBadge userId={999} forceShow={true} size="md" />
          <span>Forcé (devrait toujours s'afficher)</span>
        </div>
      </div>
    </div>
  );
};

export default TestLabelBadge;
