import React from 'react';
import PremiumRegimenCarousel from './PremiumRegimenCarousel';
import PremiumRegimenCarouselPreview from './PremiumRegimenCarouselPreview';

const PremiumRegimenCarouselModule = {
  // Module identifier
  id: 'premiumRegimenCarousel',
  
  // Human-readable name for the module
  name: 'Premium Regimen Carousel',
  
  // Description shown in the module selector
  description: 'A carousel that guides users through a step-by-step regimen or process.',
  
  // Thumbnail image path (relative to public folder)
  thumbnail: '/images/Premium Regimen Carousel.png',
  
  // Default data structure for a new instance of this module
  defaultData: {
    headline: 'Your Regimen Title',
    panels: [
      {
        id: `panel-${Date.now()}-1`,
        title: 'Step 1',
        text: '<p>Detailed explanation for step 1.</p>',
        image: '',
        navigationText: 'Step 1'
      },
      {
        id: `panel-${Date.now()}-2`,
        title: 'Step 2',
        text: '<p>Detailed explanation for step 2.</p>',
        image: '',
        navigationText: 'Step 2'
      },
      {
        id: `panel-${Date.now()}-3`,
        title: 'Step 3',
        text: '<p>Detailed explanation for step 3.</p>',
        image: '',
        navigationText: 'Step 3'
      }
    ]
  },
  
  // Editor component
  editor: (props) => (
    <PremiumRegimenCarousel 
      data={props.data} 
      onChange={props.onChange}
      onDelete={props.onDelete}
      onMoveUp={props.onMoveUp}
      onMoveDown={props.onMoveDown}
      moduleIndex={props.moduleIndex}
      modulesLength={props.modulesLength}
    />
  ),
  
  // Preview component (for the main content area)
  preview: (props) => (
    <PremiumRegimenCarouselPreview 
      data={props.data} 
      showOverlay={props.data.showOverlay !== false} // Default to true if not set
    />
  ),
  
  // Sidebar preview component (optional)
  sidebarPreview: (props) => (
    <div className="module-sidebar-preview">
      <h4>Premium Regimen Carousel</h4>
      <p>{props.data.panels?.length || 0} steps</p>
    </div>
  )
};

export default PremiumRegimenCarouselModule;
