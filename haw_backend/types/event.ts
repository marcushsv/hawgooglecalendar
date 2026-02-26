export type CalendarEvent = {
    id: string;            // für jeden Event ein eindeutiger Schlüssel (uuid)
    title: string;
    module: string;         // Titel des Termins
    description?: string;  // Optionale Beschreibung
    date: string;   // Im Format 'YYYY-MM-DD'
    mainLecturer: string; // Hauptlehrender
    subLecturer?: string;    // Nebenlehrende      
    startTime?: string;    // z.B. '15:00'
    endTime?: string; // z.B. '16:00'
    location?: string;
    veranstaltungsart?: string;


};
