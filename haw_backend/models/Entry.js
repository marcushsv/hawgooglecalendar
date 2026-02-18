const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  title: { type: String, required: true },
  dozent: String,
  raum: String,
  datum: { type: Date, required: true },
  zeitVon: String,
  zeitBis: String,
  notizen: String,
  wichtig: { type: Boolean, default: false },
  userId: String, // für später wenn Auth kommt
}, { timestamps: true });

module.exports = mongoose.model('Entry', entrySchema);