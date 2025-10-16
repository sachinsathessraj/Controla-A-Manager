const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Enable CORS for all origins (for testing)
app.use(cors());

app.use(express.json());

// MongoDB connection string (local)
const MONGO_URI = 'mongodb://localhost:27017/aplus-content';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Draft schema
const draftSchema = new mongoose.Schema({
  name: String,
  contentName: String,
  modules: Array,
  date: { type: Date, default: Date.now },
  status: { type: String, default: 'active' }
});
const Draft = mongoose.model('Draft', draftSchema);

// --- API Endpoints ---

// Get all drafts
app.get('/api/drafts', async (req, res) => {
  const drafts = await Draft.find();
  res.json(drafts);
});

// Get a single draft
app.get('/api/drafts/:id', async (req, res) => {
  const draft = await Draft.findById(req.params.id);
  if (!draft) return res.status(404).json({ error: 'Draft not found' });
  res.json(draft);
});

// Create a new draft
app.post('/api/drafts', async (req, res) => {
  const draft = new Draft(req.body);
  await draft.save();
  res.json(draft);
});

// Update a draft
app.put('/api/drafts/:id', async (req, res) => {
  const draft = await Draft.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!draft) return res.status(404).json({ error: 'Draft not found' });
  res.json(draft);
});

// Delete a draft
app.delete('/api/drafts/:id', async (req, res) => {
  const draft = await Draft.findByIdAndDelete(req.params.id);
  if (!draft) return res.status(404).json({ error: 'Draft not found' });
  res.json({ message: 'Draft deleted' });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
