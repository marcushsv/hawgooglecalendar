const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: './config.env' });
const Entry = require('./models/Entry');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.ATLAS_URI)
  .then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error(err));

// Alle Einträge abrufen
app.get('/entries', async (req, res) => {
  try {
    const entries = await Entry.find().sort({ datum: 1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eintrag erstellen
app.post('/entries', async (req, res) => {
  console.log("POST /entries body:", req.body);
  try {
    const entry = new Entry(req.body);
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eintrag löschen
app.delete('/entries/:id', async (req, res) => {
  try {
    await Entry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Gelöscht' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eintrag bearbeiten
app.put('/entries/:id', async (req, res) => {
  try {
    const entry = await Entry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/entries/:id/toggle-wichtig", async (req, res) => {
  try {
    const entry = await Entry.findByIdAndUpdate(
      req.params.id,
      [{ $set: { wichtig: { $not: "$wichtig" } } }],
      { new: true }
    );
    res.json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/ping", (req, res) => res.send("pong"));

app.listen(process.env.PORT || 3000, () => {
  console.log('Server läuft');
});
