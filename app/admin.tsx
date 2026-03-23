import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, Modal, Platform, ScrollView,
    StyleSheet, Switch, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = "http://10.0.2.2:3000";
const FACHSEMESTER_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

interface AppUser {
    _id: string;
    vorname?: string;
    nachname?: string;
    email: string;
    matrikelnummer?: string;
    role: string;
}

interface CourseEntry {
    _id: string;
    title: string;
    fachsemester: number;
    studiengang: string;
    datum: string;
    zeitVon?: string;
    zeitBis?: string;
    raum?: string;
    dozent?: string;
    wichtig?: boolean;
    notizen?: string;
    wiederholung?: string;
}

const getToken = async () => {
    if (Platform.OS === 'web') return localStorage.getItem('token');
    return await SecureStore.getItemAsync('token');
};

const AdminDashboard = () => {
    const [title, setTitle] = useState('');
    const [fachsemester, setFachsemester] = useState<number | null>(null);
    const [studiengang, setStudiengang] = useState('');
    const [datum, setDatum] = useState('');
    const [zeitVon, setZeitVon] = useState('');
    const [zeitBis, setZeitBis] = useState('');
    const [raum, setRaum] = useState('');
    const [dozent, setDozent] = useState('');
    const [wichtig, setWichtig] = useState(false);
    const [notizen, setNotizen] = useState('');
    const [wiederholung, setWiederholung] = useState<'nie' | 'wöchentlich' | '2-wöchentlich'>('nie');
    const [saving, setSaving] = useState(false);

    const [entries, setEntries] = useState<CourseEntry[]>([]);
    const [loadingEntries, setLoadingEntries] = useState(false);
    const [filterFS, setFilterFS] = useState<number | null>(null);
    const [filterSG, setFilterSG] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'erstellen' | 'verwalten' | 'import' | 'meldungen' | 'user'>('erstellen');

    const [editEntry, setEditEntry] = useState<CourseEntry | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editFachsemester, setEditFachsemester] = useState<number | null>(null);
    const [editStudiengang, setEditStudiengang] = useState('');
    const [editDatum, setEditDatum] = useState('');
    const [editZeitVon, setEditZeitVon] = useState('');
    const [editZeitBis, setEditZeitBis] = useState('');
    const [editRaum, setEditRaum] = useState('');
    const [editDozent, setEditDozent] = useState('');
    const [editWichtig, setEditWichtig] = useState(false);
    const [editNotizen, setEditNotizen] = useState('');
    const [editWiederholung, setEditWiederholung] = useState<'nie' | 'wöchentlich' | '2-wöchentlich'>('nie');
    const [editSaving, setEditSaving] = useState(false);

    const [meldungTitle, setMeldungTitle] = useState('');
    const [meldungText, setMeldungText] = useState('');
    const [meldungSaving, setMeldungSaving] = useState(false);
    const [announcements, setAnnouncements] = useState<{ _id: string; title: string; message: string; createdAt: string }[]>([]);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
    const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<string | null>(null);

    const [users, setUsers] = useState<AppUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [editUser, setEditUser] = useState<AppUser | null>(null);
    const [editUserVorname, setEditUserVorname] = useState('');
    const [editUserNachname, setEditUserNachname] = useState('');
    const [editUserEmail, setEditUserEmail] = useState('');
    const [editUserMatrikelnummer, setEditUserMatrikelnummer] = useState('');
    const [editUserNeuesPasswort, setEditUserNeuesPasswort] = useState('');
    const [editUserSaving, setEditUserSaving] = useState(false);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

    const [csvText, setCsvText] = useState('');
    const [importing, setImporting] = useState(false);
    const [importPreview, setImportPreview] = useState<any[]>([]);
    const [importError, setImportError] = useState('');

    const loadUsers = async () => {
        setLoadingUsers(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/admin/users`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json();
            setUsers(data);
        } catch (e: any) {
            Alert.alert("Fehler", e?.message ?? String(e));
        } finally {
            setLoadingUsers(false);
        }
    };

    const openEditUser = (u: AppUser) => {
        setEditUser(u);
        setEditUserVorname(u.vorname ?? '');
        setEditUserNachname(u.nachname ?? '');
        setEditUserEmail(u.email);
        setEditUserMatrikelnummer(u.matrikelnummer ?? '');
        setEditUserNeuesPasswort('');
    };

    const handleSaveUserEdit = async () => {
        if (!editUser) return;
        setEditUserSaving(true);
        try {
            const token = await getToken();
            const body: any = {
                vorname: editUserVorname,
                nachname: editUserNachname,
                email: editUserEmail,
                matrikelnummer: editUserMatrikelnummer,
            };
            if (editUserNeuesPasswort.trim()) body.neuesPasswort = editUserNeuesPasswort.trim();
            const res = await fetch(`${API_URL}/admin/users/${editUser._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(body),
            });
            if (!res.ok) { Alert.alert("Fehler", "Konnte nicht gespeichert werden."); return; }
            const updated = await res.json();
            setUsers(prev => prev.map(u => u._id === updated._id ? updated : u));
            setEditUser(null);
        } catch (e: any) {
            Alert.alert("Netzwerkfehler", e?.message ?? String(e));
        } finally {
            setEditUserSaving(false);
        }
    };

    const handleDeleteUser = (u: AppUser) => {
        Alert.alert("User löschen?", `${u.vorname ?? ''} ${u.nachname ?? ''} (${u.email}) wirklich löschen?`, [
            { text: "Abbrechen", style: "cancel" },
            {
                text: "Löschen", style: "destructive", onPress: async () => {
                    setDeletingUserId(u._id);
                    try {
                        const token = await getToken();
                        await fetch(`${API_URL}/admin/users/${u._id}`, {
                            method: 'DELETE',
                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                        });
                        setUsers(prev => prev.filter(x => x._id !== u._id));
                    } catch (e: any) {
                        Alert.alert("Fehler", e?.message ?? String(e));
                    } finally {
                        setDeletingUserId(null);
                    }
                }
            }
        ]);
    };

    const loadAnnouncements = async () => {
        setLoadingAnnouncements(true);
        try {
            const res = await fetch(`${API_URL}/announcements`);
            const data = await res.json();
            setAnnouncements(data);
        } catch (e: any) {
            Alert.alert("Fehler", e?.message ?? String(e));
        } finally {
            setLoadingAnnouncements(false);
        }
    };

    const handleSaveMeldung = async () => {
        if (!meldungTitle.trim() || !meldungText.trim()) {
            Alert.alert("Fehler", "Titel und Nachricht sind Pflichtfelder!");
            return;
        }
        setMeldungSaving(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/announcements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ title: meldungTitle.trim(), message: meldungText.trim() }),
            });
            if (!res.ok) { Alert.alert("Fehler", "Konnte nicht gespeichert werden."); return; }
            const newAnnouncement = await res.json();
            setAnnouncements(prev => [newAnnouncement, ...prev]);
            setMeldungTitle('');
            setMeldungText('');
            Alert.alert("Gesendet!", "Meldung wurde an alle User verschickt.");
        } catch (e: any) {
            Alert.alert("Netzwerkfehler", e?.message ?? String(e));
        } finally {
            setMeldungSaving(false);
        }
    };

    const handleDeleteAnnouncement = (id: string, announcementTitle: string) => {
        Alert.alert("Löschen?", `"${announcementTitle}" wirklich löschen?`, [
            { text: "Abbrechen", style: "cancel" },
            {
                text: "Löschen", style: "destructive", onPress: async () => {
                    setDeletingAnnouncementId(id);
                    try {
                        const token = await getToken();
                        await fetch(`${API_URL}/announcements/${id}`, {
                            method: 'DELETE',
                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                        });
                        setAnnouncements(prev => prev.filter(a => a._id !== id));
                    } catch (e: any) {
                        Alert.alert("Fehler", e?.message ?? String(e));
                    } finally {
                        setDeletingAnnouncementId(null);
                    }
                }
            }
        ]);
    };

    const loadEntries = async () => {
        setLoadingEntries(true);
        try {
            let url = `${API_URL}/course-entries?`;
            if (filterFS) url += `fachsemester=${filterFS}&`;
            if (filterSG.trim()) url += `studiengang=${encodeURIComponent(filterSG.trim())}`;
            const res = await fetch(url);
            const data = await res.json();
            setEntries(data);
        } catch (e: any) {
            Alert.alert("Fehler", e?.message ?? String(e));
        } finally {
            setLoadingEntries(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'verwalten') loadEntries();
        if (activeTab === 'meldungen') loadAnnouncements();
        if (activeTab === 'user') loadUsers();
    }, [activeTab]);

    const handleSave = async () => {
        if (!title.trim() || !fachsemester || !studiengang.trim() || !datum.trim()) {
            Alert.alert("Fehler", "Titel, Fachsemester, Studiengang und Datum sind Pflichtfelder!");
            return;
        }
        // Parse datum TT.MM.JJJJ -> ISO
        const parts = datum.split('.');
        if (parts.length !== 3) {
            Alert.alert("Fehler", "Datum im Format TT.MM.JJJJ eingeben.");
            return;
        }
        const [dd, mm, yyyy] = parts;
        const isoDate = `${yyyy}-${mm?.padStart(2, '0')}-${dd?.padStart(2, '0')}`;

        setSaving(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/course-entries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    title: title.trim(),
                    fachsemester,
                    studiengang: studiengang.trim().toUpperCase(),
                    datum: isoDate,
                    zeitVon: zeitVon.trim() || undefined,
                    zeitBis: zeitBis.trim() || undefined,
                    raum: raum.trim() || undefined,
                    dozent: dozent.trim() || undefined,
                    wichtig,
                    notizen: notizen.trim() || undefined,
                    wiederholung,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                Alert.alert("Fehler", err.error ?? "Konnte nicht gespeichert werden.");
                return;
            }
            Alert.alert("Gespeichert!", `"${title}" wurde als Kurseintrag angelegt.`);
            setTitle(''); setFachsemester(null); setStudiengang(''); setDatum('');
            setZeitVon(''); setZeitBis(''); setRaum(''); setDozent('');
            setWichtig(false); setNotizen(''); setWiederholung('nie');
        } catch (e: any) {
            Alert.alert("Netzwerkfehler", e?.message ?? String(e));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, entryTitle: string) => {
        Alert.alert(
            "Löschen?",
            `"${entryTitle}" wirklich löschen?`,
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Löschen", style: "destructive", onPress: async () => {
                        setDeletingId(id);
                        try {
                            const token = await getToken();
                            await fetch(`${API_URL}/course-entries/${id}`, {
                                method: 'DELETE',
                                headers: token ? { Authorization: `Bearer ${token}` } : {},
                            });
                            setEntries(prev => prev.filter(e => e._id !== id));
                        } catch (e: any) {
                            Alert.alert("Fehler", e?.message ?? String(e));
                        } finally {
                            setDeletingId(null);
                        }
                    }
                }
            ]
        );
    };

    const openEdit = (entry: CourseEntry) => {
        const d = new Date(entry.datum);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        setEditEntry(entry);
        setEditTitle(entry.title);
        setEditFachsemester(entry.fachsemester);
        setEditStudiengang(entry.studiengang);
        setEditDatum(`${dd}.${mm}.${yyyy}`);
        setEditZeitVon(entry.zeitVon ?? '');
        setEditZeitBis(entry.zeitBis ?? '');
        setEditRaum(entry.raum ?? '');
        setEditDozent(entry.dozent ?? '');
        setEditWichtig(entry.wichtig ?? false);
        setEditNotizen(entry.notizen ?? '');
        setEditWiederholung((entry.wiederholung as any) ?? 'nie');
    };

    const handleSaveEdit = async () => {
        if (!editEntry || !editTitle.trim() || !editFachsemester || !editStudiengang.trim() || !editDatum.trim()) {
            Alert.alert("Fehler", "Titel, Fachsemester, Studiengang und Datum sind Pflichtfelder!");
            return;
        }
        const parts = editDatum.split('.');
        if (parts.length !== 3) { Alert.alert("Fehler", "Datum im Format TT.MM.JJJJ eingeben."); return; }
        const [dd, mm, yyyy] = parts;
        const isoDate = `${yyyy}-${mm?.padStart(2, '0')}-${dd?.padStart(2, '0')}`;
        setEditSaving(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/course-entries/${editEntry._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    title: editTitle.trim(),
                    fachsemester: editFachsemester,
                    studiengang: editStudiengang.trim().toUpperCase(),
                    datum: isoDate,
                    zeitVon: editZeitVon.trim() || undefined,
                    zeitBis: editZeitBis.trim() || undefined,
                    raum: editRaum.trim() || undefined,
                    dozent: editDozent.trim() || undefined,
                    wichtig: editWichtig,
                    notizen: editNotizen.trim() || undefined,
                    wiederholung: editWiederholung,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                Alert.alert("Fehler", err.error ?? "Konnte nicht gespeichert werden.");
                return;
            }
            const updated = await res.json();
            setEntries(prev => prev.map(e => e._id === updated._id ? updated : e));
            setEditEntry(null);
        } catch (e: any) {
            Alert.alert("Netzwerkfehler", e?.message ?? String(e));
        } finally {
            setEditSaving(false);
        }
    };

    const parseCsv = (text: string): { rows: any[]; error: string } => {
        const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 1) return { rows: [], error: 'Keine Zeilen gefunden.' };
        // Kopfzeile überspringen falls vorhanden (zweite Spalte ist dann keine Zahl)
        const firstCols = lines[0].split(',');
        const startIndex = Number.isNaN(Number(firstCols[1]?.trim())) ? 1 : 0;
        if (lines.length <= startIndex) return { rows: [], error: 'Keine Datenzeilen gefunden.' };
        const rows: any[] = [];
        for (let i = startIndex; i < lines.length; i++) {
            const cols = lines[i].split(',');
            const [t, fs, sg, dat, zv, zb, r, d, wdh, wi] = cols.map(c => c?.trim());
            if (!t || !fs || !sg || !dat) return { rows: [], error: `Zeile ${i + 1}: Titel, Fachsemester, Studiengang und Datum sind Pflicht.` };
            const parts = dat.split('.');
            if (parts.length !== 3) return { rows: [], error: `Zeile ${i + 1}: Datum muss TT.MM.JJJJ sein.` };
            const [dd, mm, yyyy] = parts;
            const isoDate = `${yyyy}-${mm?.padStart(2, '0')}-${dd?.padStart(2, '0')}`;
            const validWdh = ['nie', 'wöchentlich', '2-wöchentlich'];
            rows.push({
                title: t,
                fachsemester: Number(fs),
                studiengang: sg.toUpperCase(),
                datum: isoDate,
                zeitVon: zv || undefined,
                zeitBis: zb || undefined,
                raum: r || undefined,
                dozent: d || undefined,
                wiederholung: validWdh.includes(wdh) ? wdh : 'nie',
                wichtig: wi?.toLowerCase() === 'true',
            });
        }
        return { rows, error: '' };
    };

    const handleImport = async () => {
        setImportError('');
        const { rows, error } = parseCsv(csvText);
        if (error) { setImportError(error); return; }
        setImportPreview(rows);
        if (rows.length === 0) { setImportError('Keine gültigen Zeilen gefunden.'); return; }
        setImporting(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/course-entries/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(rows),
            });
            if (!res.ok) {
                let errMsg = `Import fehlgeschlagen (${res.status}).`;
                try { const err = await res.json(); errMsg = err.error ?? errMsg; } catch {}
                setImportError(errMsg);
                return;
            }
            let result: any;
            try { result = await res.json(); } catch {
                setImportError('Ungültige Serverantwort.');
                return;
            }
            Alert.alert('Importiert!', `${result.inserted} Einträge erfolgreich importiert.`);
            setCsvText('');
            setImportPreview([]);
        } catch (e: any) {
            setImportError(e?.message ?? String(e));
        } finally {
            setImporting(false);
        }
    };

    const formatDate = (isoString: string) => {
        const d = new Date(isoString);
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Admin Dashboard</Text>

                <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

                    {activeTab === 'erstellen' && (
                        <View style={styles.card}>
                            <Text style={styles.sectionLabel}>Neuen Kurseintrag anlegen</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Titel / Modulname *"
                                placeholderTextColor="#6A8FAD"
                                value={title}
                                onChangeText={setTitle}
                            />

                            <Text style={styles.pickerLabel}>Fachsemester *</Text>
                            <View style={styles.pickerRow}>
                                {FACHSEMESTER_OPTIONS.map(sem => (
                                    <TouchableOpacity
                                        key={sem}
                                        style={[styles.semOption, fachsemester === sem && styles.semOptionActive]}
                                        onPress={() => setFachsemester(sem)}
                                    >
                                        <Text style={[styles.semOptionText, fachsemester === sem && styles.semOptionTextActive]}>
                                            {sem}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="Studiengang (z.B. MS, MT) *"
                                placeholderTextColor="#6A8FAD"
                                value={studiengang}
                                onChangeText={setStudiengang}
                                autoCapitalize="characters"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Datum (TT.MM.JJJJ) *"
                                placeholderTextColor="#6A8FAD"
                                value={datum}
                                onChangeText={setDatum}
                                keyboardType="numeric"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Startzeit (HH:mm)"
                                placeholderTextColor="#6A8FAD"
                                value={zeitVon}
                                onChangeText={setZeitVon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Endzeit (HH:mm)"
                                placeholderTextColor="#6A8FAD"
                                value={zeitBis}
                                onChangeText={setZeitBis}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Raum (optional)"
                                placeholderTextColor="#6A8FAD"
                                value={raum}
                                onChangeText={setRaum}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Dozent (optional)"
                                placeholderTextColor="#6A8FAD"
                                value={dozent}
                                onChangeText={setDozent}
                            />

                            <Text style={styles.pickerLabel}>Wiederholung</Text>
                            <View style={styles.pickerRow}>
                                {(['nie', 'wöchentlich', '2-wöchentlich'] as const).map(opt => (
                                    <TouchableOpacity
                                        key={opt}
                                        style={[styles.pickerOption, wiederholung === opt && styles.semOptionActive]}
                                        onPress={() => setWiederholung(opt)}
                                    >
                                        <Text style={[styles.pickerOptionText, wiederholung === opt && styles.semOptionTextActive]}>
                                            {opt}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.switchRow}>
                                <Text style={styles.switchLabel}>Wichtig</Text>
                                <Switch
                                    value={wichtig}
                                    onValueChange={setWichtig}
                                    trackColor={{ false: '#C5D7EA', true: '#002E99' }}
                                    thumbColor="white"
                                />
                            </View>

                            <TextInput
                                style={styles.notizInput}
                                placeholder="Notizen (optional)"
                                placeholderTextColor="#6A8FAD"
                                multiline
                                value={notizen}
                                onChangeText={setNotizen}
                            />

                            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                                {saving
                                    ? <ActivityIndicator color="white" />
                                    : <Text style={styles.saveButtonText}>Kurseintrag speichern</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    )}

                    {activeTab === 'verwalten' && (
                        <View style={styles.card}>
                            <Text style={styles.sectionLabel}>Einträge filtern & löschen</Text>

                            <Text style={styles.pickerLabel}>Fachsemester</Text>
                            <View style={styles.pickerRow}>
                                <TouchableOpacity
                                    style={[styles.semOption, filterFS === null && styles.semOptionActive]}
                                    onPress={() => setFilterFS(null)}
                                >
                                    <Text style={[styles.semOptionText, filterFS === null && styles.semOptionTextActive]}>Alle</Text>
                                </TouchableOpacity>
                                {FACHSEMESTER_OPTIONS.map(sem => (
                                    <TouchableOpacity
                                        key={sem}
                                        style={[styles.semOption, filterFS === sem && styles.semOptionActive]}
                                        onPress={() => setFilterFS(sem)}
                                    >
                                        <Text style={[styles.semOptionText, filterFS === sem && styles.semOptionTextActive]}>{sem}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="Studiengang filtern (optional)"
                                placeholderTextColor="#6A8FAD"
                                value={filterSG}
                                onChangeText={setFilterSG}
                                autoCapitalize="characters"
                            />

                            <TouchableOpacity style={styles.filterButton} onPress={loadEntries}>
                                <Text style={styles.filterButtonText}>Suchen</Text>
                            </TouchableOpacity>

                            {loadingEntries && <ActivityIndicator color="#002E99" style={{ marginTop: 12 }} />}

                            {!loadingEntries && entries.length === 0 && (
                                <Text style={styles.noResultsText}>Keine Einträge gefunden.</Text>
                            )}

                            {entries.map(entry => (
                                <View key={entry._id} style={styles.entryItem}>
                                    <View style={styles.entryInfo}>
                                        <Text style={styles.entryTitle}>{entry.title}</Text>
                                        <Text style={styles.entryMeta}>
                                            FS {entry.fachsemester} · {entry.studiengang}
                                        </Text>
                                        <Text style={styles.entryMeta}>
                                            {formatDate(entry.datum)}
                                            {entry.zeitVon && entry.zeitBis ? `  ·  ${entry.zeitVon} – ${entry.zeitBis}` : ''}
                                        </Text>
                                        {(entry.raum || entry.dozent) && (
                                            <Text style={styles.entryMeta}>
                                                {[entry.raum, entry.dozent].filter(Boolean).join('  ·  ')}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={styles.entryActions}>
                                        <TouchableOpacity
                                            style={styles.editButton}
                                            onPress={() => openEdit(entry)}
                                        >
                                            <Text style={styles.editButtonText}>✎</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDelete(entry._id, entry.title)}
                                            disabled={deletingId === entry._id}
                                        >
                                            {deletingId === entry._id
                                                ? <ActivityIndicator color="white" size="small" />
                                                : <Text style={styles.deleteButtonText}>✕</Text>
                                            }
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {activeTab === 'import' && (
                        <View style={styles.card}>
                            <Text style={styles.sectionLabel}>CSV-Massenimport</Text>
                            <Text style={styles.csvHint}>
                                Komma-getrennte Spalten (Kopfzeile optional):{'\n'}
                                Titel, Fachsemester, Studiengang, Datum, ZeitVon, ZeitBis, Raum, Dozent, Wiederholung, Wichtig{'\n\n'}
                                Datum: TT.MM.JJJJ  ·  Wiederholung: nie | wöchentlich | 2-wöchentlich  ·  Wichtig: true | false
                            </Text>
                            <TextInput
                                style={styles.csvInput}
                                placeholder={'Mathematik 1,1,INF,15.03.2026,08:00,10:00,A1.23,Prof. Müller,wöchentlich,false'}
                                placeholderTextColor="#6A8FAD"
                                multiline
                                value={csvText}
                                onChangeText={t => { setCsvText(t); setImportError(''); setImportPreview([]); }}
                            />
                            {importError ? (
                                <Text style={styles.importErrorText}>{importError}</Text>
                            ) : null}
                            {importPreview.length > 0 && (
                                <Text style={styles.csvHint}>{importPreview.length} Zeile(n) bereit zum Import.</Text>
                            )}
                            <TouchableOpacity style={styles.saveButton} onPress={handleImport} disabled={importing}>
                                {importing
                                    ? <ActivityIndicator color="white" />
                                    : <Text style={styles.saveButtonText}>Importieren</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    )}

                    {activeTab === 'meldungen' && (
                        <View style={styles.card}>
                            <Text style={styles.sectionLabel}>Meldung an alle User senden</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Titel (z.B. Wartungsarbeiten) *"
                                placeholderTextColor="#6A8FAD"
                                value={meldungTitle}
                                onChangeText={setMeldungTitle}
                            />
                            <TextInput
                                style={styles.notizInput}
                                placeholder="Nachricht *"
                                placeholderTextColor="#6A8FAD"
                                multiline
                                value={meldungText}
                                onChangeText={setMeldungText}
                            />
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveMeldung} disabled={meldungSaving}>
                                {meldungSaving
                                    ? <ActivityIndicator color="white" />
                                    : <Text style={styles.saveButtonText}>Meldung senden</Text>
                                }
                            </TouchableOpacity>

                            <Text style={[styles.pickerLabel, { marginTop: 20 }]}>Aktive Meldungen</Text>
                            {loadingAnnouncements && <ActivityIndicator color="#002E99" style={{ marginTop: 8 }} />}
                            {!loadingAnnouncements && announcements.length === 0 && (
                                <Text style={styles.noResultsText}>Keine aktiven Meldungen.</Text>
                            )}
                            {announcements.map(a => (
                                <View key={a._id} style={styles.entryItem}>
                                    <View style={styles.entryInfo}>
                                        <Text style={styles.entryTitle}>{a.title}</Text>
                                        <Text style={styles.entryMeta}>{a.message}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => handleDeleteAnnouncement(a._id, a.title)}
                                        disabled={deletingAnnouncementId === a._id}
                                    >
                                        {deletingAnnouncementId === a._id
                                            ? <ActivityIndicator color="white" size="small" />
                                            : <Text style={styles.deleteButtonText}>✕</Text>
                                        }
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    {activeTab === 'user' && (
                        <View style={styles.card}>
                            <Text style={styles.sectionLabel}>User verwalten</Text>

                            <TouchableOpacity style={styles.filterButton} onPress={loadUsers}>
                                <Text style={styles.filterButtonText}>Aktualisieren</Text>
                            </TouchableOpacity>

                            {loadingUsers && <ActivityIndicator color="#002E99" style={{ marginTop: 12 }} />}
                            {!loadingUsers && users.length === 0 && (
                                <Text style={styles.noResultsText}>Keine User gefunden.</Text>
                            )}
                            {users.map(u => (
                                <View key={u._id} style={styles.entryItem}>
                                    <View style={styles.entryInfo}>
                                        <Text style={styles.entryTitle}>{u.vorname} {u.nachname}</Text>
                                        <Text style={styles.entryMeta}>{u.email}</Text>
                                        {u.matrikelnummer ? <Text style={styles.entryMeta}>Matr.: {u.matrikelnummer}</Text> : null}
                                        <Text style={styles.entryMeta}>Rolle: {u.role}</Text>
                                    </View>
                                    <View style={styles.entryActions}>
                                        <TouchableOpacity style={styles.editButton} onPress={() => openEditUser(u)}>
                                            <Text style={styles.editButtonText}>✎</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDeleteUser(u)}
                                            disabled={deletingUserId === u._id}
                                        >
                                            {deletingUserId === u._id
                                                ? <ActivityIndicator color="white" size="small" />
                                                : <Text style={styles.deleteButtonText}>✕</Text>
                                            }
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {activeTab === 'user' && (
                        <TouchableOpacity style={styles.logoutButton} onPress={() => router.replace('/')}>
                            <Text style={styles.logoutButtonText}>Ausloggen</Text>
                        </TouchableOpacity>
                    )}

                </ScrollView>

                <View style={styles.tabRow}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'erstellen' && styles.tabActive]}
                        onPress={() => setActiveTab('erstellen')}
                    >
                        <Text style={[styles.tabText, activeTab === 'erstellen' && styles.tabTextActive]}>
                            Erstellen
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'verwalten' && styles.tabActive]}
                        onPress={() => setActiveTab('verwalten')}
                    >
                        <Text style={[styles.tabText, activeTab === 'verwalten' && styles.tabTextActive]}>
                            Verwalten
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'import' && styles.tabActive]}
                        onPress={() => setActiveTab('import')}
                    >
                        <Text style={[styles.tabText, activeTab === 'import' && styles.tabTextActive]}>
                            CSV Import
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'meldungen' && styles.tabActive]}
                        onPress={() => setActiveTab('meldungen')}
                    >
                        <Text style={[styles.tabText, activeTab === 'meldungen' && styles.tabTextActive]}>
                            Meldungen
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'user' && styles.tabActive]}
                        onPress={() => setActiveTab('user')}
                    >
                        <Text style={[styles.tabText, activeTab === 'user' && styles.tabTextActive]}>
                            User
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
   
            <Modal visible={!!editUser} animationType="slide" transparent onRequestClose={() => setEditUser(null)}>
                <View style={styles.modalOverlay}>
                    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                        <Text style={styles.modalTitle}>User bearbeiten</Text>

                        <TextInput style={styles.input} placeholder="Vorname" placeholderTextColor="#6A8FAD"
                            value={editUserVorname} onChangeText={setEditUserVorname} />
                        <TextInput style={styles.input} placeholder="Nachname" placeholderTextColor="#6A8FAD"
                            value={editUserNachname} onChangeText={setEditUserNachname} />
                        <TextInput style={styles.input} placeholder="E-Mail *" placeholderTextColor="#6A8FAD"
                            value={editUserEmail} onChangeText={setEditUserEmail} keyboardType="email-address" autoCapitalize="none" />
                        <TextInput style={styles.input} placeholder="Matrikelnummer" placeholderTextColor="#6A8FAD"
                            value={editUserMatrikelnummer} onChangeText={setEditUserMatrikelnummer} />
                        <TextInput style={styles.input} placeholder="Neues Passwort" placeholderTextColor="#6A8FAD"
                            value={editUserNeuesPasswort} onChangeText={setEditUserNeuesPasswort} secureTextEntry />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setEditUser(null)}>
                                <Text style={styles.modalCancelText}>Abbrechen</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.saveButton, { flex: 1 }]} onPress={handleSaveUserEdit} disabled={editUserSaving}>
                                {editUserSaving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Speichern</Text>}
                            </TouchableOpacity>
                        </View>
                        <View style={{ height: 20 }} />
                    </ScrollView>
                </View>
            </Modal>

            <Modal visible={!!editEntry} animationType="slide" transparent onRequestClose={() => setEditEntry(null)}>
                <View style={styles.modalOverlay}>
                    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                        <Text style={styles.modalTitle}>Eintrag bearbeiten</Text>

                        <TextInput style={styles.input} placeholder="Titel *" placeholderTextColor="#6A8FAD"
                            value={editTitle} onChangeText={setEditTitle} />

                        <Text style={styles.pickerLabel}>Fachsemester *</Text>
                        <View style={styles.pickerRow}>
                            {FACHSEMESTER_OPTIONS.map(sem => (
                                <TouchableOpacity key={sem}
                                    style={[styles.semOption, editFachsemester === sem && styles.semOptionActive]}
                                    onPress={() => setEditFachsemester(sem)}>
                                    <Text style={[styles.semOptionText, editFachsemester === sem && styles.semOptionTextActive]}>{sem}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput style={styles.input} placeholder="Studiengang *" placeholderTextColor="#6A8FAD"
                            value={editStudiengang} onChangeText={setEditStudiengang} autoCapitalize="characters" />
                        <TextInput style={styles.input} placeholder="Datum (TT.MM.JJJJ) *" placeholderTextColor="#6A8FAD"
                            value={editDatum} onChangeText={setEditDatum} keyboardType="numeric" />
                        <TextInput style={styles.input} placeholder="Startzeit (HH:mm)" placeholderTextColor="#6A8FAD"
                            value={editZeitVon} onChangeText={setEditZeitVon} />
                        <TextInput style={styles.input} placeholder="Endzeit (HH:mm)" placeholderTextColor="#6A8FAD"
                            value={editZeitBis} onChangeText={setEditZeitBis} />
                        <TextInput style={styles.input} placeholder="Raum (optional)" placeholderTextColor="#6A8FAD"
                            value={editRaum} onChangeText={setEditRaum} />
                        <TextInput style={styles.input} placeholder="Dozent (optional)" placeholderTextColor="#6A8FAD"
                            value={editDozent} onChangeText={setEditDozent} />

                        <Text style={styles.pickerLabel}>Wiederholung</Text>
                        <View style={styles.pickerRow}>
                            {(['nie', 'wöchentlich', '2-wöchentlich'] as const).map(opt => (
                                <TouchableOpacity key={opt}
                                    style={[styles.pickerOption, editWiederholung === opt && styles.semOptionActive]}
                                    onPress={() => setEditWiederholung(opt)}>
                                    <Text style={[styles.pickerOptionText, editWiederholung === opt && styles.semOptionTextActive]}>{opt}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>Wichtig</Text>
                            <Switch value={editWichtig} onValueChange={setEditWichtig}
                                trackColor={{ false: '#C5D7EA', true: '#002E99' }} thumbColor="white" />
                        </View>

                        <TextInput style={styles.notizInput} placeholder="Notizen (optional)" placeholderTextColor="#6A8FAD"
                            multiline value={editNotizen} onChangeText={setEditNotizen} />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setEditEntry(null)}>
                                <Text style={styles.modalCancelText}>Abbrechen</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.saveButton, { flex: 1 }]} onPress={handleSaveEdit} disabled={editSaving}>
                                {editSaving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Speichern</Text>}
                            </TouchableOpacity>
                        </View>
                        <View style={{ height: 20 }} />
                    </ScrollView>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default AdminDashboard;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'white' },
    container: { flex: 1, padding: 20 },
    title: { color: '#002E99', fontSize: 22, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
    tabRow: { flexDirection: 'row', gap: 6, marginTop: 10, paddingBottom: 4 },
    tab: { flex: 1, backgroundColor: '#C5D7EA', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 4, alignItems: 'center' },
    tabActive: { backgroundColor: '#002E99' },
    tabText: { color: '#002E99', fontWeight: '500', fontSize: 10 },
    tabTextActive: { color: 'white' },
    scroll: { flex: 1 },
    card: { backgroundColor: '#9FBDDB', borderRadius: 15, padding: 16, marginBottom: 16 },
    sectionLabel: { color: '#002E99', fontWeight: '700', fontSize: 15, marginBottom: 14, textAlign: 'center' },
    input: {
        backgroundColor: '#C5D7EA',
        borderRadius: 20,
        padding: 10,
        paddingHorizontal: 16,
        color: '#002E99',
        marginBottom: 10,
    },
    pickerLabel: { color: '#002E99', fontWeight: '500', marginBottom: 6, paddingHorizontal: 4 },
    pickerRow: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
    semOption: { flex: 1, minWidth: 36, backgroundColor: '#C5D7EA', borderRadius: 20, paddingVertical: 8, alignItems: 'center' },
    semOptionActive: { backgroundColor: '#002E99' },
    semOptionText: { color: '#002E99', fontSize: 13, fontWeight: '600' },
    semOptionTextActive: { color: 'white' },
    pickerOption: { flex: 1, backgroundColor: '#C5D7EA', borderRadius: 20, paddingVertical: 8, alignItems: 'center' },
    pickerOptionText: { color: '#002E99', fontSize: 12, fontWeight: '500' },
    switchRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#C5D7EA',
        borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 10,
        justifyContent: 'space-between',
    },
    switchLabel: { color: '#002E99' },
    notizInput: {
        backgroundColor: '#C5D7EA', borderRadius: 15, padding: 12,
        color: '#002E99', height: 80, textAlignVertical: 'top', marginBottom: 10,
    },
    saveButton: {
        backgroundColor: '#002E99', borderRadius: 20, padding: 13,
        alignItems: 'center', marginTop: 4,
    },
    saveButtonText: { color: 'white', fontSize: 15, fontWeight: '600' },
    filterButton: {
        backgroundColor: '#002E99', borderRadius: 20, padding: 10,
        alignItems: 'center', marginBottom: 12,
    },
    filterButtonText: { color: 'white', fontWeight: '600' },
    noResultsText: { color: '#002E99', textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
    entryItem: {
        backgroundColor: '#C5D7EA', borderRadius: 12, padding: 12,
        flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8,
    },
    entryInfo: { flex: 1 },
    entryTitle: { color: '#002E99', fontWeight: '600', fontSize: 14, marginBottom: 2 },
    entryMeta: { color: '#4A6A8A', fontSize: 12 },
    deleteButton: {
        backgroundColor: '#c0392b', borderRadius: 20,
        width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    },
    deleteButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
    logoutButton: {
        backgroundColor: '#9FBDDB', borderRadius: 20, padding: 13,
        alignItems: 'center', marginBottom: 24, width: '60%', alignSelf: 'center',
    },
    logoutButtonText: { color: '#002E99', fontSize: 15, fontWeight: '600' },
    csvHint: { color: '#4A6A8A', fontSize: 11, marginBottom: 10, lineHeight: 16 },
    csvInput: {
        backgroundColor: '#C5D7EA', borderRadius: 15, padding: 12,
        color: '#002E99', height: 160, textAlignVertical: 'top', marginBottom: 10,
        fontFamily: 'monospace', fontSize: 12,
    },
    importErrorText: { color: '#c0392b', fontSize: 13, marginBottom: 8 },
    entryActions: { flexDirection: 'column', gap: 6 },
    editButton: {
        backgroundColor: '#002E99', borderRadius: 20,
        width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    },
    editButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: 20, maxHeight: '90%',
    },
    modalTitle: { color: '#002E99', fontWeight: '700', fontSize: 16, textAlign: 'center', marginBottom: 14 },
    modalButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
    modalCancelButton: {
        flex: 1, backgroundColor: '#C5D7EA', borderRadius: 20, padding: 13, alignItems: 'center',
    },
    modalCancelText: { color: '#002E99', fontWeight: '600' },
});
