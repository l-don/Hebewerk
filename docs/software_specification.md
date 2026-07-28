# Software-Spezifikation: Gym Tracker App (Hebewerk)

Diese Spezifikation beschreibt alle aktuell in der Anwendung vorhandenen sowie fachlich geforderten Features. Die Darstellung unterscheidet durchgehend zwischen:
- **Ist-Zustand**: Aktuell im Quellcode implementiertes Verhalten
- **Soll-Zustand**: Fachlich korrektes und gewünschtes Zielverhalten
- **Diskrepanz**: Abweichungen, Fehler, Inkonsistenzen oder fehlende Prüfungen zwischen Ist- und Soll-Zustand
- **Festgelegte Entscheidung**: Für alle bisher offenen Punkte wurde jeweils die pragmatischste und am leichtesten umsetzbare Option gewählt.

---

## 1. Funktionsbereich: Authentifizierung & Benutzerkonto

### Feature 1.1: Registrierung mit E-Mail & Passwort
- **Mögliche Ausgangszustände**:
  - Nicht angemeldet, Formular im Modus "Konto erstellen" (`/auth`).
- **Mögliche Aktionen**:
  - Eingabe von Name, E-Mail-Adresse und Passwort; Klick auf "Konto erstellen".
- **Voraussetzungen und Berechtigungen**:
  - E-Mail entspricht gültigem Format, Passwort mindestens 6 Zeichen, Name nicht leer.
- **Erwartetes Ergebnis und Folgezustand**:
  - Benutzerkonto wird erstellt (Firebase Auth / lokale DB).
  - Profilbild-URL (Dicebear Avatar) und Standard-Stats (Level 1, 0 XP, Streak 0) werden angelegt.
  - Benutzer wird im System eingeloggt und zum Dashboard weitergeleitet (`/dashboard`).
- **Fehler- und Sonderfälle**:
  - E-Mail bereits registriert: Fehlermeldung im Auth-Banner.
  - Netzausfall / Firebase nicht erreichbar: Im lokalen Modus wird der Benutzer im `localStorage` angelegt.
- **Verhalten bei wiederholter Ausführung**:
  - Im Firebase-Modus: Fehler "E-Mail bereits vergeben".
- **Ist-Zustand**:
  - Registrierung speichert Profil lokal und in Firestore (`users/{uid}`).
  - Im lokalen Fallback wird bei erneuter Registrierung mit gleicher E-Mail das bestehende lokale Profil ohne Passwortprüfung überschrieben.
- **Soll-Zustand**:
  - E-Mail-Einzigartigkeit muss auch im lokalen Fallback geprüft werden.
  - Passwortbestätigung ("Passwort wiederholen") vor Kontoerstellung erforderlich.
- **Diskrepanz**:
  - Keine Bestätigung des Passworts im Formular.
  - Lokaler Fallback prüft nicht auf bereits existierende E-Mail-Konten.
- **Festgelegte Entscheidung (Simpelste Option)**:
  - **Passwort-Komplexität**: Mindestlänge 6 Zeichen genügt (Firebase-Standard beibehalten, keine komplexen Regex-Regeln).

---

### Feature 1.2: Anmeldung mit E-Mail & Passwort
- **Mögliche Ausgangszustände**:
  - Nicht angemeldet, Formular im Modus "Anmelden" (`/auth`).
- **Mögliche Aktionen**:
  - Eingabe von E-Mail und Passwort; Klick auf "Anmelden".
- **Voraussetzungen und Berechtigungen**:
  - Gültige E-Mail-Syntax und eingegebenes Passwort.
- **Erwartetes Ergebnis und Folgezustand**:
  - Erfolgreiche Authentifizierung, Erstellung der Sitzung (`hebewerk_user` in `localStorage`), Weiterleitung zum Dashboard (`/dashboard`).
- **Fehler- und Sonderfälle**:
  - Falsches Passwort / Unbekannter Nutzer: Fehlermeldung "Authentifizierung fehlgeschlagen".
- **Verhalten bei wiederholter Ausführung**:
  - Bereits angemeldeter Nutzer wird via AuthGuard automatisch von `/auth` auf `/dashboard` weitergeleitet.
- **Ist-Zustand**:
  - Anmeldung funktioniert über Firebase Auth. Im lokalen Fallback wird bei beliebiger E-Mail ein Platzhalter-Profil erzeugt, sofern kein Passwort abweicht.
- **Soll-Zustand**:
  - Eindeutige Fehlermeldung bei falschen Anmeldedaten.
- **Diskrepanz**:
  - Lokaler Fallback akzeptiert beliebige Passwörter für bestehende E-Mails.
- **Festgelegte Entscheidung**:
  - Keine erforderlich.

---

### Feature 1.3: Passwort zurücksetzen ("Passwort vergessen")
- **Mögliche Ausgangszustände**:
  - Nicht angemeldet, Formular im Modus "Anmelden" (`/auth`).
- **Mögliche Aktionen**:
  - Klick auf den Link "Vergessen?".
- **Voraussetzungen und Berechtigungen**:
  - Keine.
- **Erwartetes Ergebnis und Folgezustand**:
  - Dialog / Maske zur Eingabe der E-Mail-Adresse öffnet sich. Eine E-Mail zum Zurücksetzen des Passworts wird versendet.
- **Fehler- und Sonderfälle**:
  - E-Mail nicht im System: Hinweis oder neutrale Bestätigung aus Sicherheitsgründen.
- **Verhalten bei wiederholter Ausführung**:
  - Erneuter Versand der Passwort-Zurücksetzen-E-Mail.
- **Ist-Zustand**:
  - Der Link "Vergessen?" im Template verweist auf `href="javascript:void(0)"` und führt **keinerlei Aktion** aus.
- **Soll-Zustand**:
  - Klick auf "Vergessen?" öffnet ein Eingabefeld für die E-Mail-Adresse und löst über den `AuthService` den Firebase-Passwort-Reset aus (`sendPasswordResetEmail`).
- **Diskrepanz**:
  - Feature ist visuell vorhanden, aber funktional tot (Toter Link).
- **Festgelegte Entscheidung**:
  - Keine erforderlich.

---

### Feature 1.4: Abmeldung (Logout)
- **Mögliche Ausgangszustände**:
  - Angemeldeter Benutzer auf einer beliebigen Seite.
- **Mögliche Aktionen**:
  - Klick auf "Jetzt Abmelden" in den Einstellungen (`/settings`).
- **Voraussetzungen und Berechtigungen**:
  - Aktive Benutzersitzung.
- **Erwartetes Ergebnis und Folgezustand**:
  - Firebase-Abmeldung wird ausgeführt, Sitzung im `localStorage` wird gelöscht, Signal `currentUser` wird auf `null` gesetzt, Weiterleitung zu `/auth`.
- **Fehler- und Sonderfälle**:
  - Keine.
- **Verhalten bei wiederholter Ausführung**:
  - Idempotent (bereits abgemeldeter Zustand bleibt bestehen).
- **Ist-Zustand**:
  - Abmeldung bereinigt `hebewerk_user` aus dem `localStorage`.
- **Soll-Zustand**:
  - Neben `hebewerk_user` müssen auch temporäre Signale und aktive Realtime-Firestore-Listener in `FriendsService` und `WorkoutService` sauber beendet werden.
- **Diskrepanz**:
  - Firestore-Listener (z. B. `onSnapshot` für Freundschaften und Feed) laufen im Hintergrund weiter, bis die Seite neu geladen wird.
- **Festgelegte Entscheidung**:
  - Keine erforderlich.

---

## 2. Funktionsbereich: Trainingsplan-Verwaltung

### Feature 2.1: Erstellung eines neuen Trainingsplans
- **Mögliche Ausgangszustände**:
  - Angemeldeter Nutzer auf der Übersicht "Meine Trainingspläne" (`/plans`).
- **Mögliche Aktionen**:
  - Klick auf "+ Neuer Plan", Ausfüllen von Name, Beschreibung, Sichtbarkeit, Hinzufügen von Übungen & Sätzen, Klick auf "Speichern".
- **Voraussetzungen und Berechtigungen**:
  - Eingegebener Plan-Name nicht leer, mindestens 1 Übung mit mindestens 1 Satz vorhanden.
- **Erwartetes Ergebnis und Folgezustand**:
  - Plan wird gespeichert (`workout_plans` Firestore & `localStorage`), Formular schließt sich, neuer Plan erscheint in der Rasteransicht.
- **Fehler- und Sonderfälle**:
  - Ungültige Werte (0 Wdh. oder negatives Gewicht): Speichern-Button ist deaktiviert.
- **Verhalten bei wiederholter Ausführung**:
  - Erstellt bei jedem Speichern einen neuen Plan mit eindeutiger ID.
- **Ist-Zustand**:
  - Beim Öffnen des Formulars `startCreateNewPlan()` wird die Checkbox "Öffentlich teilen" (`editIsPublic`) **immer auf `false`** gesetzt, unabhängig davon, was in den Benutzereinstellungen unter "Standard-Sichtbarkeit neuer Pläne" eingestellt ist.
- **Soll-Zustand**:
  - Der Initialwert der Checkbox `isPublic` richtet sich nach dem in `user.privacySettings.plansVisibility` hinterlegten Wert (wenn `plansVisibility === 'public'`, dann `editIsPublic = true`).
- **Diskrepanz**:
  - Die globale Benutzereinstellung zur Standard-Sichtbarkeit neuer Pläne wird beim Erstellen ignoriert.
- **Festgelegte Entscheidung (Simpelste Option)**:
  - **Bestehendes Modell beibehalten**: Die Boolean-Checkbox `isPublic` (Öffentlich vs. Privat) bleibt unverändert erhalten. Wenn in den Einstellungen 'public' hinterlegt ist, ist das Häkchen vorangekreuzt, andernfalls nicht. Kein aufwendiges Redesign für ein dreistufiges Auswahlfeld.

---

### Feature 2.2: Bearbeitung eines bestehenden Trainingsplans
- **Mögliche Ausgangszustände**:
  - Angemeldeter Nutzer auf `/plans`, Planliste ist sichtbar.
- **Mögliche Aktionen**:
  - Klick auf das Stift-Icon eines Plans, Ändern der Daten, Klick auf "Speichern".
- **Voraussetzungen und Berechtigungen**:
  - Benutzer muss Eigentümer des Plans sein.
- **Erwartetes Ergebnis und Folgezustand**:
  - Aktualisierte Plandaten werden in der DB und im UI reflektiert.
- **Fehler- und Sonderfälle**:
  - Bearbeiten eines Plans, der aktuell in einer aktiven Trainingseinheit läuft: Änderungen betreffen erst zukünftige Workouts.
- **Verhalten bei wiederholter Ausführung**:
  - Überschreibt die Plandaten idempotent unter der selben Plan-ID.
- **Ist-Zustand**:
  - Funktioniert wie erwartet.
- **Soll-Zustand**:
  - Funktioniert wie erwartet.
- **Diskrepanz**:
  - Keine.
- **Festgelegte Entscheidung**:
  - Keine erforderlich.

---

### Feature 2.3: Löschen eines Trainingsplans
- **Mögliche Ausgangszustände**:
  - Angemeldeter Nutzer auf `/plans`.
- **Mögliche Aktionen**:
  - Klick auf das Mülleimer-Icon eines Plans, Bestätigung im Browser-Dialog.
- **Voraussetzungen und Berechtigungen**:
  - Eigentümer des Plans.
- **Erwartetes Ergebnis und Folgezustand**:
  - Plan wird aus der Liste und Datenbank gelöscht.
- **Fehler- und Sonderfälle**:
  - Wenn für diesen Plan aktuell eine aktive Trainingseinheit im Hintergrund läuft, bleibt das aktive Workout bestehen, verweist aber auf eine gelöschte Plan-ID.
- **Verhalten bei wiederholter Ausführung**:
  - Nach Löschung nicht mehr möglich.
- **Ist-Zustand**:
  - Löscht den Plan ohne Prüfung, ob dafür gerade ein aktives Workout läuft.
- **Soll-Zustand**:
  - Wenn ein Plan gelöscht wird, der aktuell als aktives Workout läuft, muss der Benutzer gewarnt werden und die aktive Session optional abgebrochen werden.
- **Diskrepanz**:
  - Fehlende Verknüpfungsprüfung zwischen Plan-Löschung und aktiver Session.
- **Festgelegte Entscheidung**:
  - Keine erforderlich.

---

### Feature 2.4: Kopieren eines fremden / öffentlichen Trainingsplans
- **Mögliche Ausgangszustände**:
  - Nutzer betrachtet Freunde-Profil (`/friends`) oder Plan-Vorschau-Modal im Dashboard.
- **Mögliche Aktionen**:
  - Klick auf "Kopieren" / "Plan zu meinen Plänen kopieren".
- **Voraussetzungen und Berechtigungen**:
  - Der Plan muss öffentlich sein oder dem aktuellen Nutzer gehören.
- **Erwartetes Ergebnis und Folgezustand**:
  - Eine Duplikat-Kopie des Plans wird unter der `userId` des aktuellen Nutzers mit dem Namenszusatz `(Kopie)` und `isPublic: false` erstellt und gespeichert. Toast-Benachrichtigung erscheint.
- **Fehler- und Sonderfälle**:
  - Mehrmaliges Klicken erzeugt mehrere Identische Kopien.
- **Verhalten bei wiederholter Ausführung**:
  - Erzeugt bei jedem Klick eine weitere Kopie ("Plan (Kopie)", "Plan (Kopie)").
- **Ist-Zustand**:
  - Kopieren funktioniert.
- **Soll-Zustand**:
  - Unbegrenztes Kopieren ohne zusätzliche Warnmodale (aktuelles schnelles UX-Verhalten beibehalten).
- **Diskrepanz**:
  - Keine.
- **Festgelegte Entscheidung (Simpelste Option)**:
  - **Unbegrenztes Kopieren erlauben**: Auf komplexe Namensprüfung und Bestätigungs-Dialoge verzichten.

---

## 3. Funktionsbereich: Trainingsdurchführung & Live-Session

### Feature 3.1: Starten und Ausführen eines Workouts
- **Mögliche Ausgangszustände**:
  - Nutzer auf `/plans` oder Dashboard-Banner.
- **Mögliche Aktionen**:
  - Klick auf "STARTEN" bei einem Trainingsplan.
- **Voraussetzungen und Berechtigungen**:
  - Plan muss existieren und Übungen enthalten.
- **Erwartetes Ergebnis und Folgezustand**:
  - Navigation zur Workout-Ansicht (`/workout/{planId}`).
  - Eine aktive Session (`ActiveWorkoutSession`) wird gestartet, im Speicher abgelegt und der Timer für die Gesamtdauer beginnt zu laufen.
  - Richtwerte (Ziel-Gewicht / Ziel-Wdh.) werden aus dem letzten absolvierten Workout dieses Plans geladen (Fallback: Plan-Standardwerte).
- **Fehler- und Sonderfälle**:
  - Nutzer startet Workout, obwohl bereits ein anderes Workout aktiv ist: Das bestehende Workout wird ohne Rückfrage überschrieben oder wiederhergestellt.
- **Verhalten bei wiederholter Ausführung**:
  - Navigiert zur laufenden Session.
- **Ist-Zustand**:
  - Ein bestehendes aktives Workout für einen anderen Plan wird beim Starten eines neuen Plans stumm überschrieben.
- **Soll-Zustand**:
  - Beim Starten eines neuen Workouts muss geprüft werden, ob bereits ein aktives Workout existiert. Falls ja, muss eine Dialogabfrage erscheinen ("Laufendes Training abbrechen und neues starten?").
- **Diskrepanz**:
  - Fehlende Warnung vor dem Überschreiben laufender Einheiten.
- **Festgelegte Entscheidung**:
  - Keine erforderlich.

---

### Feature 3.2: Wiederherstellung & Abbrechen einer laufenden Trainingseinheit
- **Mögliche Ausgangszustände**:
  - Nutzer hat eine laufende Einheit und verlässt die App / wechselt die Seite.
- **Mögliche Aktionen**:
  - Dashboard zeigt gelbes Banner "● LAUFENDES TRAINING AKTIV". Klick auf "TRAINING FORTSETZEN" oder "Abbrechen".
- **Voraussetzungen und Berechtigungen**:
  - Vorhandene aktive Session in `localStorage` oder Firestore.
- **Erwartetes Ergebnis und Folgezustand**:
  - "Fortsetzen": Öffnet `/workout/{planId}` mit exakt dem zuvor erfassten Stand (abgehakte Sätze, Gewichte, verstrichene Zeit).
  - "Abbrechen": Verwirft die Session unwiderruflich, löscht `active_workouts`.
- **Fehler- und Sonderfälle**:
  - Browser-Cache gelöscht: Session geht lokal verloren (wird aus Firestore wiederhergestellt, falls eingeloggt).
- **Verhalten bei wiederholter Ausführung**:
  - Abbrechen löscht die Session dauerhaft.
- **Ist-Zustand**:
  - Wiederherstellung und Abbrechen auf dem Dashboard funktionieren.
- **Soll-Zustand**:
  - Funktioniert wie erwartet.
- **Diskrepanz**:
  - Keine.
- **Festgelegte Entscheidung**:
  - Keine erforderlich.

---

### Feature 3.3: Erfassung von Sätzen, Gewichten und Notizen
- **Mögliche Ausgangszustände**:
  - Aktives Workout geöffnet (`/workout/{id}`).
- **Mögliche Aktionen**:
  - Eingabe von Ist-Gewicht, Ist-Wiederholungen, Notizen pro Satz/Übung.
  - Klick auf das Häkchen ("✓") neben einem Satz.
- **Voraussetzungen und Berechtigungen**:
  - Aktives Workout vorhanden.
- **Erwartetes Ergebnis und Folgezustand**:
  - Satz wird als erledigt markiert (`completed = true`), Zeile verfärbt sich gelb.
  - Der automatische Pausen-Timer startet für diesen Satz.
- **Fehler- und Sonderfälle**:
  - Eingabe ungültiger Zahlen (z. B. negative Gewichte): Eingabefeld sollte eingeschränkt sein.
- **Verhalten bei wiederholter Ausführung**:
  - Erneuter Klick schaltet den Status um (`completed = false`).
- **Ist-Zustand**:
  - Nur Sätze, bei denen das Häkchen **explizit gesetzt wurde**, werden beim Beenden des Workouts in der Historie gespeichert. Eingetragene Gewichte ohne gesetztes Häkchen gehen beim Beenden verloren!
- **Soll-Zustand**:
  - Beim Klick auf "Training beenden" werden alle Sätze, in denen valide Werte (Gewicht >= 0, Wdh. > 0) eingetragen sind, automatisch als erledigt gewertet und mitgespeichert.
- **Diskrepanz**:
  - Stilles Verwerfen von eingegebenen Satzdaten, wenn das Häkchen nicht gesetzt wurde.
- **Festgelegte Entscheidung (Simpelste Option)**:
  - **Automatische Erfassung ausgefüllter Sätze beim Beenden**: Es ist kein zusätzlicher Warn-Dialog nötig. Die Beenden-Funktion erweitert die Bedingung einfach um `s.completed || (s.reps > 0 && s.weight >= 0)`.

---

### Feature 3.4: Automatische Satzpause (Rest-Timer) & Benachrichtigungen
- **Mögliche Ausgangszustände**:
  - Aktives Workout geöffnet, Satz wird abgehakt.
- **Mögliche Aktionen**:
  - Rest-Timer startet automatisch. Steuerung via "Pause", "Weiter", "Überspringen".
- **Voraussetzungen und Berechtigungen**:
  - Benachrichtigungs-Berechtigung des Browsers (optional für Push-Events).
- **Erwartetes Ergebnis und Folgezustand**:
  - Timer zählt die im Plan definierte Pausenzeit herunter (`restSeconds`).
  - Bei Erreichen der Zielzeit: Akustisches Signal (Audio Chime), Vibration (Mobilgeräte) und Browser-Push-Benachrichtigung ("Satzpause beendet!").
- **Fehler- und Sonderfälle**:
  - Browser-Tab im Hintergrund oder Smartphone gesperrt: `AudioContext` kann von Browser-Autoplay-Richtlinien blockiert werden.
- **Verhalten bei wiederholter Ausführung**:
  - Ein neuer Timer stoppt den vorherigen Timer sauber.
- **Ist-Zustand**:
  - Timer zählt die verstreichende Zeit hoch (`elapsedSeconds`) und prüft, ob `elapsedSeconds >= targetSeconds`.
- **Soll-Zustand**:
  - Beibehaltung des aktuellen Verhaltens (Zählen von 0 bis Zielzeit mit visueller Fortschrittsanzeige), da es voll funktionsfähig und fehlerfrei ist.
- **Diskrepanz**:
  - Keine.
- **Festgelegte Entscheidung (Simpelste Option)**:
  - **Stoppuhr-Logik im `TimerService` beibehalten**: Keine aufwendigen Umbauten am `TimerService`.

---

### Feature 3.5: Abschluss des Workouts
- **Mögliche Ausgangszustände**:
  - Mindestens 1 Satz im aktiven Workout abgehakt.
- **Mögliche Aktionen**:
  - Klick auf "Training beenden".
- **Voraussetzungen und Berechtigungen**:
  - Mindestens 1 abgeschlossener Satz.
- **Erwartetes Ergebnis und Folgezustand**:
  - Log-Eintrag wird in `workout_logs` (Firestore & `localStorage`) gespeichert.
  - Gesamtvolumen und XP werden berechnet: `XP = (Sätze * 10) + (Volumen / 100)`.
  - Nutzer-Statistiken (XP, Level, Streak, LastActive) werden aktualisiert.
  - Überprüfung auf persönliche Rekorde (PR): Wenn das max. Arbeitsgewicht bisherige Workouts übersteigt, wird ein PR-Badge generiert.
  - Eintrag wird zum Aktivitätsfeed hinzugefügt.
  - Aktive Session wird gelöscht.
  - Zusammenfassungs-Bildschirm mit Konfetti-Animation öffnet sich.
- **Fehler- und Sonderfälle**:
  - Keine Sätze abgehakt: Hinweis-Alert "Bitte logge mindestens einen abgeschlossenen Satz...".
- **Verhalten bei wiederholter Ausführung**:
  - Ein Workout kann nur einmal abgeschlossen werden.
- **Ist-Zustand**:
  - Funktioniert vollumfänglich.
- **Soll-Zustand**:
  - Funktioniert wie erwartet.
- **Diskrepanz**:
  - Keine.
- **Festgelegte Entscheidung**:
  - Keine erforderlich.

---

## 4. Funktionsbereich: Trainingsverlauf & Historie

### Feature 4.1: Anzeige & Detailansicht der Historie
- **Mögliche Ausgangszustände**:
  - Nutzer befindet sich auf der Seite "Trainingsverlauf" (`/history`).
- **Mögliche Aktionen**:
  - Scrollen durch die chronologische Liste aller absolvierten Einheiten; Klick auf "Details anzeigen" / "Details ausblenden" (Akkordeon).
- **Voraussetzungen und Berechtigungen**:
  - Angemeldeter Nutzer.
- **Erwartetes Ergebnis und Folgezustand**:
  - Liste zeigt Datum, Planname, Dauer in Minuten und erhaltene XP.
  - Aufklappen zeigt alle Übungen, Satz-Details (Gewicht, Wdh., Richtwerte) sowie individuelle Satz- und Übungsnotizen.
- **Fehler- und Sonderfälle**:
  - Keine Absolvierten Einheiten: Anzeige eines Empty-States ("Keine Trainingseinträge").
- **Verhalten bei wiederholter Ausführung**:
  - Beliebiges Ein- und Ausklappen der Details möglich.
- **Ist-Zustand**:
  - Historie zeigt alle Einträge in einer langen Liste.
- **Soll-Zustand**:
  - Historie ist eine reine, unveränderliche Protokollansicht (Read-Only). Einzellöschungen sind nicht vorgesehen, um XP-/Level-Inkonsistenzen zu vermeiden.
- **Diskrepanz**:
  - Keine.
- **Festgelegte Entscheidung (Simpelste Option)**:
  - **Historie als unveränderliches Logbook belassen**: Kein Entwicklungsaufwand für rückwirkende XP-Neuberechnungen oder Stornierungslogik bei Einzellöschungen.

---

## 5. Funktionsbereich: Social, Freundschaften & Nutzer-Suche

### Feature 5.1: Suche nach Athleten
- **Mögliche Ausgangszustände**:
  - Nutzer auf `/friends`, Reiter "Freunde suchen".
- **Mögliche Aktionen**:
  - Eingabe von Text im Suchfeld (ab 2 Zeichen).
- **Voraussetzungen und Berechtigungen**:
  - Angemeldeter Nutzer.
- **Erwartetes Ergebnis und Folgezustand**:
  - Anzeige aller passenden Nutzer (E-Mail oder Anzeigename).
- **Fehler- und Sonderfälle**:
  - Keine Treffer: Anzeige "Keine Nutzer unter ... gefunden".
- **Verhalten bei wiederholter Ausführung**:
  - Suchergebnisse aktualisieren sich bei jeder Eingabe.
- **Ist-Zustand**:
  - Sucht alle Nutzer aus Firestore/Mock DB. Ignoriert dabei die Privatsphäre-Einstellung `showInSearch` der Ziel-Nutzer sowie den bestehenden Freundschaftsstatus!
- **Soll-Zustand**:
  - Die Suche darf Nutzer **nicht anzeigen**, die in ihren Einstellungen `showInSearch = false` gewählt haben.
  - Bereits befreundete Nutzer oder Nutzer mit ausstehender Anfrage sollten entsprechend gekennzeichnet werden (z. B. "Bereits befreundet" statt "Anfrage senden").
- **Diskrepanz**:
  - Die Privatsphäre-Einstellung `showInSearch` wird in der Nutzersuche komplett ignoriert.
  - Bereits bestehende Freunde werden in der Suche als neue Kontakte zum Hinzufügen angeboten.
- **Festgelegte Entscheidung**:
  - Keine erforderlich.

---

### Feature 5.2: Senden & Verwalten von Freundschaftsanfragen (Doppel-Freundschafts-Problem)
- **Mögliche Ausgangszustände**:
  - Nutzer auf `/friends`, Reiter "Freunde suchen", "Eingehend" oder "Gesendet".
- **Mögliche Aktionen**:
  - Klick auf "Anfrage senden", "Annehmen", "Ablehnen" oder "Zurückziehen".
- **Voraussetzungen und Berechtigungen**:
  - Angemeldeter Nutzer.
- **Erwartetes Ergebnis und Folgezustand**:
  - "Anfrage senden": Erstellt Freundschaftseintrag mit `status: 'pending'`.
  - "Annehmen": Setzt Status auf `'accepted'`. Beide Nutzer sind befreundet.
  - "Ablehnen" / "Zurückziehen": Löscht den Freundschaftseintrag.
- **Fehler- und Sonderfälle**:
  - **Doppel-Freundschafts-Bug (Bekannte Diskrepanz #1)**:
    - User A sendet User B eine Anfrage -> Dokument `friendship_A_B` entsteht.
    - User B sendet User A eine Anfrage -> Dokument `friendship_B_A` entsteht (da die ID aus `${user.uid}_${targetUserId}` gebildet wird).
    - Beide nehmen die Anfrage an -> User A und B sind **doppelt befreundet** und erscheinen doppelt in den Freundeslisten.
- **Verhalten bei wiederholter Ausführung**:
  - Erneutes Senden erzeugt doppelte Firestore-Dokumente.
- **Ist-Zustand**:
  - Keine Prüfung auf Gegenanfragen oder bestehende Freundschaften. Dokumenten-ID ist gerichtet (`user1_user2`), wodurch reziproke Einträge möglich sind.
- **Soll-Zustand**:
  - Zwischen zwei Personen darf **höchstens eine aktive Freundschaft oder Anfrage** existieren.
  - Die Dokumenten-ID muss deterministisch und ungerichtet generiert werden: `friendship_${[uid1, uid2].sort().join('_')}`.
  - Damit existiert pro Paar exakt ein Dokument in Firestore, was doppelte Freundschaften mathematisch unmöglich macht.
- **Diskrepanz**:
  - Zwei Nutzer können sich mehrfach anfreunden und sind anschließend mehrfach in der Freundesliste enthalten.
- **Festgelegte Entscheidung**:
  - Keine erforderlich (deterministische ID ist der einfachste und sauberste Fix).

---

### Feature 5.3: Freundesliste & Entfernen von Freundschaften
- **Mögliche Ausgangszustände**:
  - Nutzer auf `/friends`, Reiter "Meine Freunde".
- **Mögliche Aktionen**:
  - Ansehen der Freunde, deren Level, Streak, XP sowie deren öffentlichen Trainingsplänen. Kopieren von öffentlichen Plänen.
- **Voraussetzungen und Berechtigungen**:
  - Freundschaft im Status `'accepted'`.
- **Erwartetes Ergebnis und Folgezustand**:
  - Freundeskarte wird angezeigt.
- **Fehler- und Sonderfälle**:
  - Keine Möglichkeit, einen Freund zu entfernen.
- **Verhalten bei wiederholter Ausführung**:
  - N/A.
- **Ist-Zustand**:
  - Es existiert **kein Button oder Menü**, um eine bestehende Freundschaft wieder aufzulösen.
- **Soll-Zustand**:
  - Jedes Freundes-Karten-Element erhält einen Button "Freund entfernen", der das zugehörige Freundschafts-Dokument löscht.
- **Diskrepanz**:
  - Einmal geschlossene Freundschaften können von Nutzern nicht mehr beendet werden.
- **Festgelegte Entscheidung**:
  - Keine erforderlich.

---

## 6. Funktionsbereich: Aktivitätsfeed & Plan-Vorschau

### Feature 6.1: Anzeige des Aktivitätsfeeds (Live Feed)
- **Mögliche Ausgangszustände**:
  - Dashboard (`/dashboard`) aufgerufen.
- **Mögliche Aktionen**:
  - Betrachtung des Notizbuch-Feeds "AKTIVITÄTEN DEINER FREUNDE".
- **Voraussetzungen und Berechtigungen**:
  - Angemeldeter Nutzer.
- **Erwartetes Ergebnis und Folgezustand**:
  - Feed zeigt die letzten absolvierten Einheiten von Freunden und eigene Einheiten.
- **Fehler- und Sonderfälle**:
  - Keine Freunde / Keine Aktivitäten: Empty-State wird angezeigt.
- **Verhalten bei wiederholter Ausführung**:
  - Feed aktualisiert sich live bei neuen Einträgen via Firestore `onSnapshot`.
- **Ist-Zustand (Bekannte Diskrepanz #2)**:
  - In Firestore-Modus: `loadActivityFeed()` lädt die 30 neuesten globalen Feed-Einträge aller App-Nutzer. Wenn der Nutzer **0 oder 1 Freund hat (`friendIds.size <= 1`)**, schaltet die Logik auf Fallback um und zeigt **die Aktivitäten aller wildfremden App-Nutzer** im Feed an!
  - In LocalStorage-Modus: Zeigt alle lokalen Feed-Einträge ungefiltert an.
- **Soll-Zustand**:
  - Striktes Filtern des Feeds: Es werden **ausschließlich** eigene Aktivitäten und Aktivitäten von bestätigten Freunden angezeigt. Der Fallback `friendIds.size <= 1` wird ersatzlos entfernt.
- **Diskrepanz**:
  - Der Feed zeigt fremde Nutzeraktivitäten an, wenn der aktuelle Nutzer wenige oder keine Freunde hat.
- **Festgelegte Entscheidung (Simpelste Option)**:
  - **Nur eigene + Freundes-Aktivitäten anzeigen**: Entfernen der `friendIds.size <= 1` Sonderregel im Client-Filter.

---

### Feature 6.2: Plan-Vorschau und Privatsphären-Prüfung über den Feed
- **Mögliche Ausgangszustände**:
  - Nutzer klickt auf einen Eintrag im Aktivitätsfeed auf dem Dashboard.
- **Mögliche Aktionen**:
  - Klick auf den Workout-Namen im Feed öffnet das Modal "Plan-Vorschau".
- **Voraussetzungen und Berechtigungen**:
  - Feed-Eintrag vorhanden.
- **Erwartetes Ergebnis und Folgezustand**:
  - Wenn der zugrundeliegende Plan öffentlich ist (`isPublic !== false`): Zeigt Übungen, Sätze, Gewichte und den Button "Plan zu meinen Plänen kopieren".
  - Wenn der Plan privat ist (`isPublic === false`): Zeigt Schloss-Symbol und Hinweis "Privater Trainingsplan von [Name]".
- **Fehler- und Sonderfälle**:
  - Urheber hat den Plan gelöscht: System rekonstruiert die Übungen aus den im Feed-Item eingebetteten historischen Satzdaten.
- **Verhalten bei wiederholter Ausführung**:
  - Modal schließt und öffnet sich zuverlässig.
- **Ist-Zustand**:
  - Wenn ein Nutzer ein Workout absolviert, dessen Plan als privat markiert ist (`isPublic === false`), wird trotzdem der exakte Workout-Name im Feed für alle Freunde sichtbar gepostet. Erst beim Klick auf den Eintrag erscheint die Meldung "Privater Trainingsplan".
- **Soll-Zustand**:
  - Wenn ein Workout auf einem privaten Plan basiert (`plan.isPublic === false`), wird beim Abschluss erst gar kein Eintrag in den Aktivitätsfeed gepostet.
- **Diskrepanz**:
  - Inkonsistente Geheimhaltung: Name des privaten Plans leakt im öffentlichen Feed.
- **Festgelegte Entscheidung (Simpelste Option)**:
  - **Private Workouts gar nicht im Feed veröffentlichen**: In `addToActivityFeed()` einfach `if (!log.isPublic) return;` ausführen. Das vermeidet jegliche Sonderfall-Logik im UI-Feed.

---

## 7. Funktionsbereich: Dashboard, Statistiken & Gamification

### Feature 7.1: KPI-Anzeige & Streak-Berechnung
- **Mögliche Ausgangszustände**:
  - Dashboard (`/dashboard`) aufgerufen.
- **Mögliche Aktionen**:
  - Betrachten von Level, XP-Fortschrittsbalken, Streak-Widget, Letztem Training.
- **Voraussetzungen und Berechtigungen**:
  - Angemeldeter Nutzer.
- **Erwartetes Ergebnis und Folgezustand**:
  - Zeigt korrekte zusammengerechnete Werte.
- **Fehler- und Sonderfälle**:
  - Keine Workouts vorhanden: Anzeige von Standardwerten / Empty States.
- **Verhalten bei wiederholter Ausführung**:
  - Werte aktualisieren sich automatisch über Angular Signals.
- **Ist-Zustand**:
  - **Streak-Einheiten-Inkonsistency**: Die Methode `updateStats()` berechnet die Tagesdifferenz (`diffDays`) zwischen `lastActive` und heute. Wenn `diffDays === 1`, erhöht sich der Zähler um `+1`. Auf dem Dashboard wird dieser Zähler jedoch mit der Beschriftung **"WOCHEN"** angezeigt!
- **Soll-Zustand**:
  - Die Berechnung misst Tages-Abstände, daher wird die Beschriftung im Dashboard-Template von "WOCHEN" auf **"TAGE"** geändert.
- **Diskrepanz**:
  - Logik misst Tage, Benutzeroberfläche beschriftet Wochen.
- **Festgelegte Entscheidung (Simpelste Option)**:
  - **Umstellung der Beschriftung auf "TAGE"**: Reine Textanpassung im Template, die bestehende Tages-Streak-Berechnung im Backend/Service bleibt exakt so bestehen.

---

### Feature 7.2: Diagramme & Fortschrittsanalysen (Volumen & Kraftzuwachs)
- **Mögliche Ausgangszustände**:
  - Dashboard (`/dashboard`) aufgerufen, mindestens 1 Log vorhanden.
- **Mögliche Aktionen**:
  - Betrachten der zwei Chart.js-Diagramme:
    1. "Gesamtvolumen Entwicklung"
    2. "Kraftzuwachs Hauptübungen"
- **Voraussetzungen und Berechtigungen**:
  - Vorhandene Workout-Logs.
- **Erwartetes Ergebnis und Folgezustand**:
  - Diagramme zeigen den zeitlichen Verlauf an.
- **Fehler- und Sonderfälle**:
  - Keine Daten: Empty-State mit Button "Test-Statistiken laden".
- **Verhalten bei wiederholter Ausführung**:
  - Diagramme werden bei neuen Logs neu gerendert.
- **Ist-Zustand**:
  - Das Kraftzuwachs-Diagramm filtert fest auf Übungsnamen, die die Zeichenketten `"kniebeugen"`, `"squat"`, `"bankdrücken"` oder `"bench"` enthalten. Wenn ein Nutzer andere Übungen trainiert, bleibt das Diagramm leer.
- **Soll-Zustand**:
  - Das Kraft-Diagramm ermittelt automatisch im `computed()` Signal die 2 am häufigsten in den Logs vorkommenden Übungen des Nutzers und stellt deren Gewichtsentwicklung dar.
- **Diskrepanz**:
  - Hardcodierte Übungsnamen-Filter im Kraft-Diagramm schließen abweichende Schreibweisen und andere Übungen aus.
- **Festgelegte Entscheidung (Simpelste Option)**:
  - **Automatische Ermittlung der 2 häufigsten Übungen**: Kein neuer UI-Kontroll-Overhead (wie Dropdowns), rein automatische Auswertung der Logs.

---

### Feature 7.3: Testdaten-Generierung (Mock Data)
- **Mögliche Ausgangszustände**:
  - Dashboard oder Einstellungen geöffnet.
- **Mögliche Aktionen**:
  - Klick auf "Test-Statistiken laden (3 Monate Daten)".
- **Voraussetzungen und Berechtigungen**:
  - Angemeldeter Nutzer.
- **Erwartetes Ergebnis und Folgezustand**:
  - Befüllt das Benutzerkonto mit realistischen Workout-Logs der letzten 90 Tage. Das Dashboard aktualisiert sofort alle Diagramme und KPIs.
- **Fehler- und Sonderfälle**:
  - Keine.
- **Verhalten bei wiederholter Ausführung**:
  - Fügt weitere Testdaten hinzu oder überschreibt bestehende Daten.
- **Ist-Zustand**:
  - Lädt Mock-Daten lokal und synchronisiert sie bei Bedarf.
- **Soll-Zustand**:
  - Funktioniert wie erwartet.
- **Diskrepanz**:
  - Keine.
- **Festgelegte Entscheidung**:
  - Keine erforderlich.

---

## 8. Funktionsbereich: Einstellungen, Privatsphäre & PWA

### Feature 8.1: Profil-Bearbeitung (Anzeigename)
- **Mögliche Ausgangszustände**:
  - Nutzer in den Einstellungen (`/settings`).
- **Mögliche Aktionen**:
  - Ändern des Namens im Eingabefeld "Anzeigename", Klick auf "Speichern".
- **Voraussetzungen und Berechtigungen**:
  - Name darf nicht leer sein.
- **Erwartetes Ergebnis und Folgezustand**:
  - Name und zugehörige Dicebear-Avatar-URL werden aktualisiert, im Speicher gesichert und im UI/Header übernommen.
- **Fehler- und Sonderfälle**:
  - Leerer Name: Speichern wird ignoriert.
- **Verhalten bei wiederholter Ausführung**:
  - Namensänderung beliebig oft möglich.
- **Ist-Zustand**:
  - Aktualisiert den Namen im Benutzerprofil.
- **Soll-Zustand**:
  - Bei Namensänderung wird der Name im zentralen `users/{uid}` Dokument aktualisiert. Da Freundeslisten Profile dynamisch über die `uid` auflösen, wird die Änderung dort automatisch übernommen.
- **Diskrepanz**:
  - Keine.
- **Festgelegte Entscheidung**:
  - Keine erforderlich.

---

### Feature 8.2: Privatsphäre-Einstellungen & Ungenutzte Konfigurationen
- **Mögliche Ausgangszustände**:
  - Nutzer in den Einstellungen (`/settings`), Bereich "Social & Privatsphäre".
- **Mögliche Aktionen**:
  - Umschalten von `profileVisibility` (Jeder / Nur Freunde / Niemand).
  - Umschalten von `plansVisibility` (Öffentlich / Nur Freunde / Privat).
  - Umschalten der Checkbox `showInSearch` (In Nutzersuche auffindbar).
  - Klick auf "Privatsphäre Speichern".
- **Voraussetzungen und Berechtigungen**:
  - Angemeldeter Nutzer.
- **Erwartetes Ergebnis und Folgezustand**:
  - Einstellungen werden im Profilobjekt `user.privacySettings` gespeichert.
- **Fehler- und Sonderfälle**:
  - Keine.
- **Verhalten bei wiederholter Ausführung**:
  - Speichert die gewählten Einstellungen.
- **Ist-Zustand**:
  - Die drei Einstellungen werden gespeichert, im Code aber bisher ignoriert.
- **Soll-Zustand**:
  - `showInSearch` filtert die Nutzersuche (`FriendsService.searchUsers()`).
  - `plansVisibility` befüllt die Vorauswahl der Checkbox beim Erstellen neuer Pläne.
  - `profileVisibility` steuert die Abrufbarkeit des Profils.
- **Diskrepanz**:
  - Dekorative / wirkungslose Privatsphäre-Formulare in den Einstellungen ("Placebo-Einstellungen").
- **Festgelegte Entscheidung**:
  - Strikte Auswertung der Einstellungen in den entsprechenden Services/Komponenten ohne Änderung des Formulars.

---

### Feature 8.3: Konto & Trainingsdaten zurücksetzen (Reset)
- **Mögliche Ausgangszustände**:
  - Nutzer in den Einstellungen (`/settings`).
- **Mögliche Aktionen**:
  - Klick auf "Alles Zurücksetzen (Reset)", Bestätigung im Confirm-Dialog.
- **Voraussetzungen und Berechtigungen**:
  - Angemeldeter Nutzer.
- **Erwartetes Ergebnis und Folgezustand**:
  - Sämtliche Workout-Logs werden gelöscht.
  - Das Profil wird auf Level 1, 0 XP, 0 Streak zurückgesetzt.
  - Aktivitätsfeed des Nutzers wird geleert.
- **Fehler- und Sonderfälle**:
  - Falls im Hintergrund ein aktives Workout läuft, wird dieses mit gelöscht (`clearActiveWorkout()`).
- **Verhalten bei wiederholter Ausführung**:
  - Setzt das Konto auf den Initialzustand zurück.
- **Ist-Zustand**:
  - Funktioniert für Logs und Profil-Stats.
- **Soll-Zustand**:
  - Reset löscht Historie & Stats sowie laufende Workouts, belässt aber selbst angelegte Pläne im Konto (aktuelles Verhalten beibehalten).
- **Diskrepanz**:
  - Keine.
- **Festgelegte Entscheidung (Simpelste Option)**:
  - **Erstellte Pläne beim Reset behalten**: Keine Löschung der Pläne beim Konto-Reset.

---

### Feature 8.4: PWA-Installation (Progressive Web App)
- **Mögliche Ausgangszustände**:
  - Nutzer ruft die Anwendung im mobilen Browser oder Desktop-Browser auf.
- **Mögliche Aktionen**:
  - Klick auf "Jetzt auf Startbildschirm installieren" oder Befolgen der iOS/Android-Anleitung.
- **Voraussetzungen und Berechtigungen**:
  - Browser unterstützt PWA / Manifest.
- **Erwartetes Ergebnis und Folgezustand**:
  - Native Installation-Prompt wird angezeigt; App wird als Standalone-Anwendung auf dem Gerät installiert.
- **Fehler- und Sonderfälle**:
  - Bereits installiert: Banner zeigt grünen Haken "App ist bereits auf deinem Startbildschirm installiert!".
- **Verhalten bei wiederholter Ausführung**:
  - Button wird ausgeblendet, wenn bereits installiert.
- **Ist-Zustand**:
  - PWA-Service erkennt Install-Prompts, iOS und Standalone-Modus korrekt.
- **Soll-Zustand**:
  - Funktioniert wie erwartet.
- **Diskrepanz**:
  - Keine.
- **Festgelegte Entscheidung**:
  - Keine erforderlich.

---

## 9. Zusammenfassung aller festgelegten Entscheidungen

| Feature / Bereich | Problem / Frage | Gewählte simpelste Option (Festgelegtes Verhalten) |
|---|---|---|
| **1.1 Auth** | Passwort-Komplexität | **Mindestlänge 6 Zeichen** genügt (Firebase Auth Standard). |
| **2.1 Pläne** | Sichtbarkeit 'Nur Freunde' | **Bestehende `isPublic` Checkbox beibehalten**; vorangekreuzt wenn `plansVisibility === 'public'`. |
| **2.4 Pläne** | Mehrfaches Kopieren | **Unbegrenztes Kopieren erlauben** ohne Warnmodale. |
| **3.3 Live-Workout** | Ungehakte Sätze beim Beenden | **Automatisch alle ausgefüllten Sätze mitzählen** (`s.completed \|\| (reps > 0 && weight >= 0)`). |
| **3.4 Live-Workout** | Rest-Timer Anzeige | **Vorhandene Stoppuhr-Anzeige (0s -> Ziel) beibehalten** im `TimerService`. |
| **4.1 Historie** | Einzelne Einträge bearbeiten/löschen | **Historie bleibt Read-Only** (kein Einzel-Löschen/Editieren), um XP-Inkonsistenzen zu vermeiden. |
| **5.2 Social** | Doppel-Freundschaften Fix | **Deterministische Dokument-ID** `friendship_${[uid1, uid2].sort().join('_')}` verwenden. |
| **6.1 Feed** | Feed-Sichtbarkeit | **Nur eigene + Freundes-Aktivitäten** anzeigen (Entfernen des `friendIds.size <= 1` Fallbacks). |
| **6.2 Feed** | Private Pläne im Feed | **Private Workouts gar nicht im Feed posten** (`if (!plan.isPublic) return;`). |
| **7.1 Dashboard** | Streak-Einheiten Beschriftung | **Beschriftung auf "TAGE" ändern** (reine UI-Anpassung, da die Logik bereits Tagesdifferenzen zählt). |
| **7.2 Dashboard** | Kraftzuwachs-Diagramm Übungen | **Automatische Ermittlung der 2 häufigsten Übungen** im `computed()` Signal. |
| **8.3 Settings** | Konto-Reset Umfang | **Erstellte Pläne beim Reset behalten** (nur Logs, Stats & Feed zurücksetzen). |
