import React from 'react';
import FreelancerTopBarLayout from './FreelancerTopBarLayout';
import FreelancerSidebar from './FreelancerSidebar';

const FreelancerLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <FreelancerTopBarLayout />
      <div className="flex">
        <FreelancerSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default FreelancerLayout;
