const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: './config.env' });
const Entry = require('./models/Entry');
const CourseEntry = require('./models/CourseEntry');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.ATLAS_URI)
  .then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error(err));

// Alle Einträge abrufen
app.get('/entries', async (req, res) => {
  try {
    const userId = req.query.userId; // ← aus Query-Parameter
    const filter = userId ? { userId } : {};
    const entries = await Entry.find(filter).sort({ datum: 1 });
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
    const entry = await Entry.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eintrag teilweise aktualisieren
app.patch('/entries/:id', async (req, res) => {
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

// Registrieren
app.post('/auth/register', async (req, res) => {
    try {
        const { vorname, nachname, matrikelnummer, email, passwort } = req.body;
        const hash = await bcrypt.hash(passwort, 10);
        const user = new User({ vorname, nachname, matrikelnummer, email, passwort: hash });
        await user.save();
        res.status(201).json({ message: 'Registriert!' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Login
app.post('/auth/login', async (req, res) => {
    try {
        const { email, passwort } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User nicht gefunden' });
        const ok = await bcrypt.compare(passwort, user.passwort);
        if (!ok) return res.status(401).json({ error: 'Falsches Passwort' });
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { _id: user._id, vorname: user.vorname, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/auth/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const { userId } = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(userId).select('-passwort');
        res.json(user);
    } catch { res.status(401).json({ error: 'Nicht autorisiert' }); }
});
app.put('/auth/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const { userId } = jwt.verify(token, process.env.JWT_SECRET);
        const { altesPasswort, neuesPasswort } = req.body;
        const user = await User.findById(userId);
        const ok = await bcrypt.compare(altesPasswort, user.passwort);
        if (!ok) return res.status(401).json({ error: 'Altes Passwort falsch' });
        user.passwort = await bcrypt.hash(neuesPasswort, 10);
        await user.save();
        res.json({ message: 'Passwort geändert!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Course Entries (Admin erstellt, User kann hinzufügen) ---

// Alle Kurseinträge suchen (nach Fachsemester und Studiengang)
app.get('/course-entries', async (req, res) => {
  try {
    const { fachsemester, studiengang } = req.query;
    const filter = {};
    if (fachsemester) filter.fachsemester = Number(fachsemester);
    if (studiengang) filter.studiengang = { $regex: new RegExp(`^${studiengang}$`, 'i') };
    const entries = await CourseEntry.find(filter).sort({ datum: 1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kurseintrag erstellen (nur Admin – Auth-Check kommt später)
app.post('/course-entries', async (req, res) => {
  try {
    const entry = new CourseEntry(req.body);
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Kurseinträge als Bulk importieren (Admin)
app.post('/course-entries/bulk', async (req, res) => {
  try {
    const entries = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'Keine Einträge übergeben.' });
    }
    const result = await CourseEntry.insertMany(entries, { ordered: false });
    res.status(201).json({ inserted: result.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Kurseintrag bearbeiten (Admin)
app.put('/course-entries/:id', async (req, res) => {
  try {
    const entry = await CourseEntry.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!entry) return res.status(404).json({ error: 'Eintrag nicht gefunden.' });
    res.json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Kurseintrag löschen (Admin)
app.delete('/course-entries/:id', async (req, res) => {
  try {
    await CourseEntry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Gelöscht' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/ping", (req, res) => res.send("pong"));

app.listen(process.env.PORT || 3000, () => {
  console.log('Server läuft');
});
