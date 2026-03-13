import { BlueDataCard } from '@/components/BlueDataCard';
import { getUserId } from '@/utils/auth';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = "http://10.0.2.2:3000";

const CARD_COLORS: Record<string, string> = {
  'nie': '#9FBDDB',
  'wöchentlich': '#9FDBBD',
  '2-wöchentlich': '#C49FDB',
};

type Entry = {
  _id: string;
  title: string;
  dozent?: string;
  raum?: string;
  datum: string;
  zeitVon?: string;
  zeitBis?: string;
  notizen?: string;
  wichtig?: boolean;
  wiederholung?: 'nie' | 'wöchentlich' | '2-wöchentlich';
};

// DD.MM.YYYY → YYYY-MM-DD
const displayToISO = (display: string) => {
  const parts = display.split('.');
  if (parts.length !== 3) return display;
  const [d, m, y] = parts;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

// YYYY-MM-DD... → DD.MM.YYYY
const isoToDisplay = (iso: string) => {
  if (!iso || iso.length < 10) return iso;
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
};

const Home = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Modal
  const [editVisible, setEditVisible] = useState(false);
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [editDatum, setEditDatum] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editRaum, setEditRaum] = useState('');
  const [editDozent, setEditDozent] = useState('');
  const [editWichtig, setEditWichtig] = useState(false);
  const [editNotiz, setEditNotiz] = useState('');
  const [editWiederholung, setEditWiederholung] = useState<'nie' | 'wöchentlich' | '2-wöchentlich'>('nie');
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const userId = await getUserId();
      const res = await fetch(`${API_URL}/entries?userId=${userId}`);
      if (!res.ok) throw new Error("Entries konnten nicht geladen werden");
      const data = await res.json();
      setEntries(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openEdit = (ev: Entry) => {
    setEditId(ev._id);
    setEditName(ev.title);
    setEditDatum(ev.datum ? isoToDisplay(ev.datum.slice(0, 10)) : '');
    setEditStartTime(ev.zeitVon ?? '');
    setEditEndTime(ev.zeitBis ?? '');
    setEditRaum(ev.raum ?? '');
    setEditDozent(ev.dozent ?? '');
    setEditWichtig(ev.wichtig ?? false);
    setEditNotiz(ev.notizen ?? '');
    setEditWiederholung(ev.wiederholung ?? 'nie');
    setEditVisible(true);
  };

  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const findConflicts = (datum: string, zeitVon: string, zeitBis: string, allEntries: Entry[], excludeId?: string) =>
    allEntries.filter(e => {
      if (excludeId && e._id === excludeId) return false;
      if (!e.zeitVon || !e.zeitBis) return false;
      if (e.datum.slice(0, 10) !== datum.slice(0, 10)) return false;
      return toMinutes(zeitVon) < toMinutes(e.zeitBis) && toMinutes(zeitBis) > toMinutes(e.zeitVon);
    });

  const handleSaveEdit = async () => {
    if (!editName || !editDatum || !editStartTime || !editEndTime) {
      Alert.alert('Fehler', 'Name und Datum/Uhrzeit sind Pflichtfelder!');
      return;
    }

    const isoDate = displayToISO(editDatum);
    const conflicts = findConflicts(isoDate, editStartTime, editEndTime, entries, editId);
    if (conflicts.length > 0) {
      const names = conflicts.map(c => `• ${c.title} (${c.zeitVon}–${c.zeitBis})`).join('\n');
      Alert.alert(
        'Zeitkonflikt',
        `Dieser Eintrag überschneidet sich mit:\n${names}`,
        [
          { text: 'Ändern', style: 'cancel' },
          { text: 'Trotzdem speichern', onPress: () => doSaveEdit(isoDate) },
        ]
      );
      return;
    }

    await doSaveEdit(isoDate);
  };

  const doSaveEdit = async (isoDate: string) => {
    setEditSaving(true);
    try {
      const res = await fetch(`${API_URL}/entries/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editName,
          datum: isoDate,
          zeitVon: editStartTime,
          zeitBis: editEndTime,
          raum: editRaum,
          dozent: editDozent,
          wichtig: editWichtig,
          notizen: editNotiz,
          wiederholung: editWiederholung,
        }),
      });
      if (!res.ok) { Alert.alert('Fehler', await res.text()); return; }
      const updated = await res.json();
      setEntries(prev => prev.map(e => e._id === editId ? updated : e));
      setEditVisible(false);
    } catch (e: any) {
      Alert.alert('Netzwerkfehler', e?.message ?? String(e));
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleWichtig = (id: string, currentWichtig: boolean) => {
    fetch(`${API_URL}/entries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wichtig: !currentWichtig }),
    })
      .then(r => r.json())
      .then(updated => setEntries(prev => prev.map(e => e._id === id ? { ...e, wichtig: updated.wichtig } : e)))
      .catch(console.error);
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Achtung!', `Soll der Eintrag "${title}" wirklich gelöscht werden?`, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen', style: 'destructive', onPress: () => {
          fetch(`${API_URL}/entries/${id}`, { method: 'DELETE' })
            .then(() => {
              setEntries(prev => prev.filter(e => e._id !== id));
              setEditVisible(false);
            })
            .catch(console.error);
        }
      },
    ]);
  };

  const today = new Date();
  const localDateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayKey = localDateKey(today);
  const todayFormatted = today.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const isRecurringToday = (e: Entry) => {
    if (!e.wiederholung || e.wiederholung === 'nie') return false;
    const entryDate = new Date(e.datum);
    if (entryDate.getDay() !== today.getDay()) return false;
    if (entryDate > today) return false;
    if (e.wiederholung === 'wöchentlich') return true;
    if (e.wiederholung === '2-wöchentlich') {
      const diffWeeks = Math.round((today.getTime() - entryDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return diffWeeks % 2 === 0;
    }
    return false;
  };

  const isSearching = searchQuery.trim().length > 0;
  const q = searchQuery.trim().toLowerCase();

  const displayedEntries = isSearching
    ? entries.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.dozent ?? '').toLowerCase().includes(q) ||
        (e.raum ?? '').toLowerCase().includes(q) ||
        (e.notizen ?? '').toLowerCase().includes(q)
      ).sort((a, b) => a.datum.localeCompare(b.datum))
    : entries
        .filter(e => localDateKey(new Date(e.datum)) === todayKey || isRecurringToday(e))
        .sort((a, b) => (a.zeitVon || '').localeCompare(b.zeitVon || ''));

  const renderEntries = () => {
    if (loading) return <ActivityIndicator color="#002E99" style={{ marginTop: 20 }} />;
    if (displayedEntries.length === 0) return (
      <Text style={{ marginTop: 16, color: '#6A8FAD', fontSize: 13 }}>
        {isSearching ? 'Keine Einträge gefunden.' : 'Heute keine Vorlesungen 🎉'}
      </Text>
    );
    return displayedEntries.map((ev) => (
      <BlueDataCard
        key={ev._id}
        title={isSearching
          ? `${isoToDisplay(ev.datum.slice(0, 10))}  ·  ${ev.zeitVon ?? '??:??'}-${ev.zeitBis ?? '??:??'}  –  ${ev.title}`
          : `${ev.zeitVon ?? "??:??"}-${ev.zeitBis ?? "??:??"} Uhr - ${ev.title}`
        }
        subtitle={[
          `Dozent: ${ev.dozent ?? "-"}`,
          ...(ev.raum ? [`Raum: ${ev.raum}`] : []),
          ...(ev.wiederholung && ev.wiederholung !== 'nie' ? [`${ev.wiederholung}`] : []),
        ]}
        onPress={() => {}}
        cardColor={CARD_COLORS[ev.wiederholung ?? 'nie']}
        titleColor={ev.wichtig ? '#E67E22' : undefined}
      >
        <Text style={{ color: '#002E99' }}>Notizen:</Text>
        <Text style={{ color: '#002E99' }}>{ev.notizen?.trim() ? ev.notizen : "-"}</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(ev)}>
            <Text style={styles.btnText}>Bearbeiten</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.editBtn, ev.wichtig && { backgroundColor: '#F0A500' }]}
            onPress={() => handleToggleWichtig(ev._id, ev.wichtig ?? false)}
          >
            <Text style={styles.btnText}>{ev.wichtig ? 'Als unwichtig markieren' : 'Als wichtig markieren'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.editBtn, { backgroundColor: '#c0392b' }]} onPress={() => handleDelete(ev._id, ev.title)}>
            <Text style={styles.btnText}>Löschen</Text>
          </TouchableOpacity>
        </View>
      </BlueDataCard>
    ));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={{ flex: 1 }}>
          <Image
            source={require("../../assets/images/HAW_Logo.jpg")}
            style={styles.hawLogo}
            resizeMode='contain'
          />
          <Text style={styles.title}>Willkommen zu deinem Kalender</Text>

          {/* Suchleiste */}
          <TextInput
            style={styles.searchInput}
            placeholder="Einträge durchsuchen..."
            placeholderTextColor="#6A8FAD"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />

          {!isSearching && (
            <Text style={{ marginTop: 4, color: '#6A8FAD', fontSize: 13 }}>
              Termine für heute, den {todayFormatted}.{'\n'}
              Tippe auf einen Termin, um Details zu sehen.{'\n'}
            </Text>
          )}

          {renderEntries()}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editVisible} animationType="slide" transparent={false} onRequestClose={() => setEditVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
          <ScrollView style={{ padding: 20 }}>
            <Image source={require("../../assets/images/HAW_Logo.jpg")} style={styles.hawLogo} resizeMode='contain' />

            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Eintrag bearbeiten</Text>

              <TextInput style={styles.input} placeholder="Modulname" placeholderTextColor="#6A8FAD" value={editName} onChangeText={setEditName} />
              <TextInput style={styles.input} placeholder="Datum (TT.MM.JJJJ)" placeholderTextColor="#6A8FAD" value={editDatum} onChangeText={setEditDatum} />
              <TextInput style={styles.input} placeholder="Startzeit (HH:mm)" placeholderTextColor="#6A8FAD" value={editStartTime} onChangeText={setEditStartTime} />
              <TextInput style={styles.input} placeholder="Endzeit (HH:mm)" placeholderTextColor="#6A8FAD" value={editEndTime} onChangeText={setEditEndTime} />
              <TextInput style={styles.input} placeholder="Raum (optional)" placeholderTextColor="#6A8FAD" value={editRaum} onChangeText={setEditRaum} />
              <TextInput style={styles.input} placeholder="Dozent (optional)" placeholderTextColor="#6A8FAD" value={editDozent} onChangeText={setEditDozent} />

              <Text style={styles.pickerLabel}>Wiederholung</Text>
              <View style={styles.pickerRow}>
                {(['nie', 'wöchentlich', '2-wöchentlich'] as const).map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.pickerOption, editWiederholung === opt && styles.pickerOptionActive]}
                    onPress={() => setEditWiederholung(opt)}
                  >
                    <Text style={[styles.pickerOptionText, editWiederholung === opt && { color: 'white' }]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.switchRow}>
                <Text style={{ color: '#002E99' }}>Wichtig</Text>
                <Switch
                  value={editWichtig}
                  onValueChange={setEditWichtig}
                  trackColor={{ false: '#393a3c', true: '#002E99' }}
                  thumbColor="white"
                />
              </View>

              <TextInput
                style={styles.notizInput}
                placeholder="Notiz:"
                placeholderTextColor="#6A8FAD"
                multiline
                value={editNotiz}
                onChangeText={setEditNotiz}
              />
            </View>

            <TouchableOpacity style={styles.btnSave} onPress={handleSaveEdit} disabled={editSaving}>
              {editSaving ? <ActivityIndicator color="white" /> : <Text style={styles.btnSaveText}>Speichern</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnCancel} onPress={() => setEditVisible(false)}>
              <Text style={[styles.btnSaveText, { color: '#002E99' }]}>Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnDelete} onPress={() => handleDelete(editId, editName)}>
              <Text style={styles.btnSaveText}>Löschen</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  contentContainer: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: "500", marginTop: 20, textAlign: 'left', color: '#3a38ac' },
  hawLogo: { width: 120, height: 50, alignSelf: 'flex-end' },
  searchInput: {
    backgroundColor: '#EEF3F8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#002E99',
    marginTop: 16,
    fontSize: 14,
  },
  editBtn: {
    backgroundColor: '#002E99',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  btnText: { color: 'white', fontSize: 12, fontWeight: '600' },
  // Modal
  modalCard: { backgroundColor: '#9FBDDB', borderRadius: 15, padding: 16, marginTop: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#002E99', marginBottom: 14 },
  input: {
    backgroundColor: '#C5D7EA', borderRadius: 20, padding: 10,
    paddingHorizontal: 16, color: '#002E99', marginBottom: 10,
  },
  pickerLabel: { color: '#002E99', fontWeight: '500', marginBottom: 6, paddingHorizontal: 4 },
  pickerRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  pickerOption: { flex: 1, backgroundColor: '#C5D7EA', borderRadius: 20, paddingVertical: 8, alignItems: 'center' },
  pickerOptionActive: { backgroundColor: '#002E99' },
  pickerOptionText: { color: '#002E99', fontSize: 12, fontWeight: '500' },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#C5D7EA',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
    marginBottom: 10, justifyContent: 'space-between',
  },
  notizInput: {
    backgroundColor: '#C5D7EA', borderRadius: 15, padding: 12,
    color: '#002E99', minHeight: 80, textAlignVertical: 'top',
  },
  btnSave: {
    backgroundColor: '#002E99', borderRadius: 20, padding: 14,
    alignItems: 'center', marginTop: 24, width: '60%', alignSelf: 'center',
  },
  btnCancel: {
    backgroundColor: '#9FBDDB', borderRadius: 20, padding: 14,
    alignItems: 'center', marginTop: 10, width: '60%', alignSelf: 'center',
  },
  btnDelete: {
    backgroundColor: '#c0392b', borderRadius: 20, padding: 14,
    alignItems: 'center', marginTop: 10, width: '60%', alignSelf: 'center',
  },
  btnSaveText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
