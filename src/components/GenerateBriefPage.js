import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useFormSubmit } from '../hooks/useFormSubmit';
import '../css/GenerateBriefPage.css';

const GenerateBriefPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    productName: '',
    imageUrl: '',
    amazonUrl: ''
  });
  
  const { submitForm, isSubmitting, error, isSuccess } = useFormSubmit('https://n8n.srv843956.hstgr.cloud/webhook-test/aplus/controla');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await submitForm(formData);
      
      // Reset form after successful submission
      setFormData({
        productName: '',
        imageUrl: '',
        amazonUrl: ''
      });
      
      // Show success message
      toast.success('Form submitted successfully!');
      
      // Optionally navigate to a success page or next step
      // navigate('/success');
      
    } catch (err) {
      // Error is already handled in the hook
      toast.error('Failed to submit form. Please try again.');
    }
  };

  return (
    <div className="generate-brief-container">
      <div className="generate-brief-header">
        <h1>Generate Brief</h1>
        <p>Fill in the details below to generate a content brief for your product.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="generate-brief-form">
        <div className="form-group">
          <label htmlFor="productName">Product Name *</label>
          <input
            type="text"
            id="productName"
            name="productName"
            value={formData.productName}
            onChange={handleChange}
            placeholder="Enter product name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="imageUrl">Image URL *</label>
          <input
            type="url"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="amazonUrl">Amazon URL *</label>
          <input
            type="url"
            id="amazonUrl"
            name="amazonUrl"
            value={formData.amazonUrl}
            onChange={handleChange}
            placeholder="https://www.amazon.com/dp/..."
            required
          />
        </div>


        <div className="form-actions">
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={isSubmitting || !formData.productName || !formData.imageUrl || !formData.amazonUrl}
          >
            {isSubmitting ? 'Submitting...' : 'Generate Brief'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GenerateBriefPage;
