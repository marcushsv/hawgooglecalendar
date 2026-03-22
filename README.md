# HAW Kalender App

Eine mobile Kalender-App für Studierende der HAW Hamburg (Hochschule für Angewandte Wissenschaften), entwickelt mit React Native / Expo.

## Features

**Für Studierende**
- Kursplan nach Semester und Studiengang durchsuchen und abonnieren
- Eigene Kalendereinträge erstellen (einmalig, wöchentlich, zweiwöchentlich)
- Wochen-Kalenderansicht mit farbkodierten Einträgen
- Einträge als „wichtig" markieren
- Push-Benachrichtigungen für bevorstehende Termine

**Für Admins**
- Kurse erstellen, bearbeiten, löschen und als Bulk-Import hinzufügen
- Nutzerverwaltung (Rollen, Passwörter, Konten)
- Ankündigungen an alle Nutzer senden

**Für Gäste**
- Kursplan ohne Login einsehen

## Tech Stack

| Bereich | Technologie |
|---|---|
| Frontend | React Native, Expo, Expo Router, TypeScript |
| Backend | Express.js, MongoDB, Mongoose |
| Auth | JWT, bcryptjs, expo-secure-store |
| UI | react-native-calendars, Reanimated |

## Voraussetzungen

- Node.js
- MongoDB (lokal oder Atlas)
- Expo CLI (`npm install -g expo-cli`)

## Installation

```bash
# Dependencies installieren
npm install

# Backend starten
cd haw_backend
node index.js

# App starten
npx expo start
```

Die App kann im [Expo Go](https://expo.dev/go), im Android-Emulator oder iOS-Simulator geöffnet werden.

## Projektstruktur

```
hawgooglecalendarr/
├── app/
│   ├── (tabs)/          # Haupt-Tabs: Home, Kalender, Eintrag hinzufügen, Wichtig, Profil
│   ├── admin.tsx         # Admin-Dashboard
│   ├── login.tsx
│   ├── register.tsx
│   └── guestCalendar.tsx
├── haw_backend/
│   ├── index.js          # Express-Server & API-Routen
│   └── models/           # Mongoose-Schemas: User, Entry, CourseEntry, Announcement
├── components/           # Wiederverwendbare UI-Komponenten
├── utils/                # Auth-Hilfsfunktionen, Notifications
└── constants/            # Farben & App-Konstanten
```

## Umgebungsvariablen

Im `haw_backend/`-Ordner eine `.env`-Datei anlegen:

```env
MONGO_URI=mongodb://localhost:27017/hawkalender
JWT_SECRET=dein_geheimes_jwt_secret
```

## Admin-Account erstellen

```bash
cd haw_backend
node createAdmin.js
```
