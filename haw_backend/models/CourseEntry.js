const mongoose = require('mongoose');

const courseEntrySchema = new mongoose.Schema({
  title: { type: String, required: true },
  fachsemester: { type: Number, required: true },
  studiengang: { type: String, required: true },
  dozent: String,
  raum: String,
  datum: { type: Date, required: true },
  zeitVon: String,
  zeitBis: String,
  notizen: String,
  wichtig: { type: Boolean, default: false },
  wiederholung: { type: String, enum: ['nie', 'wöchentlich', '2-wöchentlich'], default: 'nie' },
}, { timestamps: true });

module.exports = mongoose.model('CourseEntry', courseEntrySchema);
