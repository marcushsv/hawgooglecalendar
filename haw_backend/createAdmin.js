require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const ADMIN_EMAIL = 'admin@haw-hamburg.de';
const ADMIN_PASSWORT = 'Admin1234!'; // Bitte nach dem ersten Login ändern!

async function createAdmin() {
    await mongoose.connect(process.env.ATLAS_URI);
    console.log('MongoDB verbunden');

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
        console.log('Admin existiert bereits:', existing.email);
        process.exit(0);
    }

    const hash = await bcrypt.hash(ADMIN_PASSWORT, 10);
    const admin = new User({
        vorname: 'Admin',
        nachname: 'HAW',
        matrikelnummer: '0000000',
        email: ADMIN_EMAIL,
        passwort: hash,
        role: 'admin',
    });
    await admin.save();
    console.log('✓ Admin-Account angelegt!');
    console.log('  E-Mail:   ', ADMIN_EMAIL);
    console.log('  Passwort: ', ADMIN_PASSWORT);
    console.log('  Bitte Passwort nach dem ersten Login ändern!');
    process.exit(0);
}

createAdmin().catch(err => { console.error(err); process.exit(1); });
