const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    vorname: String,
    nachname: String,
    matrikelnummer: { type: String, unique: true },
    email: { type: String, unique: true, required: true },
    passwort: { type: String, required: true },
    role: { type: String, default: 'student' },
    hiddenEntries: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);