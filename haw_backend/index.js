const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: './config.env' });
const Entry = require('./models/Entry');
const CourseEntry = require('./models/CourseEntry');
const Announcement = require('./models/Announcement');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.ATLAS_URI)
  .then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error(err));

app.get('/entries', async (req, res) => {
  try {
    const userId = req.query.userId;
    const filter = userId ? { userId } : {};
    let entries = await Entry.find(filter).sort({ datum: 1 });
    if (userId) {
      const user = await User.findById(userId).select('hiddenEntries');
      if (user?.hiddenEntries?.length) {
        const hidden = new Set(user.hiddenEntries.map(String));
        entries = entries.filter(e => !hidden.has(String(e._id)));
      }
    }
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/users/:userId/hide-entry/:entryId', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, {
      $addToSet: { hiddenEntries: req.params.entryId }
    });
    res.json({ message: 'Ausgeblendet' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

app.delete('/entries/:id', async (req, res) => {
  try {
    await Entry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Gelöscht' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/entries/:id', async (req, res) => {
  try {
    const entry = await Entry.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

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

app.post('/course-entries', async (req, res) => {
  try {
    const entry = new CourseEntry(req.body);
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

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

app.put('/course-entries/:id', async (req, res) => {
  try {
    const entry = await CourseEntry.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!entry) return res.status(404).json({ error: 'Eintrag nicht gefunden.' });
    res.json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/course-entries/:id', async (req, res) => {
  try {
    await CourseEntry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Gelöscht' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/admin/users', async (req, res) => {
    try {
        const users = await User.find().select('-passwort').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/admin/users/:id', async (req, res) => {
    try {
        const { vorname, nachname, email, matrikelnummer, neuesPasswort } = req.body;
        const update = {};
        if (vorname !== undefined) update.vorname = vorname;
        if (nachname !== undefined) update.nachname = nachname;
        if (email !== undefined) update.email = email;
        if (matrikelnummer !== undefined) update.matrikelnummer = matrikelnummer;
        if (neuesPasswort) update.passwort = await bcrypt.hash(neuesPasswort, 10);
        const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwort');
        if (!user) return res.status(404).json({ error: 'User nicht gefunden' });
        res.json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/admin/users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Gelöscht' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/announcements', async (req, res) => {
  try {
    const announcement = new Announcement(req.body);
    await announcement.save();
    res.status(201).json(announcement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/announcements/:id', async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Gelöscht' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/ping", (req, res) => res.send("pong"));

app.listen(process.env.PORT || 3000, () => {
  console.log('Server läuft');
});
