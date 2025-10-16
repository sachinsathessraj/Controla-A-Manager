import '../css/App.css';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LandingPage from './LandingPage';
import controlaLogo from '../images/controla-logo.png';
import headerThumbnail from '../images/Standard Image Header With Text .png';
import axios from 'axios';
import PremiumContentEditPage from '../database/PremiumContentEditPage.js';
import React from 'react';
import premiumFullImagePlaceholder from '../images/premium-full-image-placeholder.png';
import ManageDraftsModal from '../components/ManageDraftsModal';
import PremiumManageDraftsPage from '../components/PremiumManageDraftsPage';
import BasicManageDraftsPage from '../database/BasicManageDraftsPage.js';
import standardImageHeaderWithText from '../images/Standard Image Header With Text .png';
import Dashboard from '../components/Dashboard';
import { saveDraftToSupabase, getDraftsFromSupabase, deleteDraftFromSupabase } from '../database/supabaseDrafts';
import { uploadImageToSupabase, getLocalImage } from '../database/supabaseStorage';
import { cleanupLocalStorage } from '../database/cleanupLocalStorage';

// Run cleanup on app start
cleanupLocalStorage().catch(error => {
  console.warn('Failed to clean up local storage:', error);
});

// ... rest of the code with acmDB references removed ... 