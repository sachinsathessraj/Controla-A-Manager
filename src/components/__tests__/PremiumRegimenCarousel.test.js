import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PremiumRegimenCarousel from '../PremiumRegimenCarousel';

const TestWrapper = () => {
  const [data, setData] = useState({});
  
  return (
    <PremiumRegimenCarousel 
      data={data}
      onChange={setData}
      onDelete={() => {}}
      onMoveUp={() => {}}
      onMoveDown={() => {}}
      moduleIndex={0}
      modulesLength={1}
      showHeader={true}
    />
  );
};

describe('PremiumRegimenCarousel', () => {
  it('renders without crashing', () => {
    render(<TestWrapper />);
    expect(screen.getByText('Premium Regimen Carousel')).toBeInTheDocument();
  });

  it('allows adding and removing panels', () => {
    render(<TestWrapper />);
    
    // Should start with 3 panels by default
    expect(screen.getAllByText(/Step \d+/).length).toBe(3);
    
    // Add a new panel
    fireEvent.click(screen.getByText('Add Step'));
    expect(screen.getAllByText(/Step \d+/).length).toBe(4);
    
    // Remove a panel
    const deleteButtons = screen.getAllByRole('button', { name: /delete panel/i });
    fireEvent.click(deleteButtons[0]);
    expect(screen.getAllByText(/Step \d+/).length).toBe(3);
  });

  it('allows editing panel details', () => {
    render(<TestWrapper />);
    
    // Edit panel title
    const titleInput = screen.getByPlaceholderText('Enter panel title');
    fireEvent.change(titleInput, { target: { value: 'New Panel Title' } });
    expect(titleInput.value).toBe('New Panel Title');
    
    // Edit navigation text
    const navInput = screen.getByPlaceholderText('Enter navigation text');
    fireEvent.change(navInput, { target: { value: 'Step One' } });
    expect(navInput.value).toBe('Step One');
  });

  it('allows toggling overlay visibility', () => {
    render(<TestWrapper />);
    
    const checkbox = screen.getByLabelText('Show text overlay on image');
    expect(checkbox.checked).toBe(true);
    
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });
});
