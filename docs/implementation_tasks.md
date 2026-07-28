# Umsetzungsaufgaben: Gym Tracker App (Hebewerk)

Dieses Dokument leitet aus der [Software-Spezifikation](software_specification.md) konkrete, strukturierte und direkt umsetzbare Entwicklungsaufgaben ab.

---

## Übersicht der Arbeitspakete (Work Packages)

- **Paket 1: Authentifizierung & Benutzerkonto (Auth)**
- **Paket 2: Trainingsplan-Verwaltung (Plans)**
- **Paket 3: Trainingsdurchführung & Live-Session (Workout & Timer)**
- **Paket 4: Social, Freundschaften & Nutzersuche (Social)**
- **Paket 5: Aktivitätsfeed & Privatsphäre (Activity Feed)**
- **Paket 6: Dashboard, KPIs & Statistiken (Dashboard & Charts)**
- **Paket 7: Einstellungen & System-Cleanup (Settings & Storage)**

---

## Paket 1: Authentifizierung & Benutzerkonto

### Task 1.1: Passwortbestätigung & Lokale E-Mail-Prüfung bei Registrierung
- **Betroffene Dateien**: 
  - `src/app/components/auth/auth.component.ts`
  - `src/app/services/auth.service.ts`
- **Ziel**: 
  Fehlerfreie Registrierung mit Passwortbestätigung und Schutz vor doppelter lokaler Kontoerstellung.
- **Konkrete Schritte**:
  1. Im Registrierungsformular (`auth.component.ts`) ein Feld `confirmPassword` ("Passwort wiederholen") einfügen.
  2. Vor Aufruf von `signUpWithEmail` prüfen, ob `password === confirmPassword`. Falls nicht, Fehlermeldung "Passwörter stimmen nicht überein" anzeigen.
  3. In `auth.service.ts` (`signUpWithEmail` im lokalen Fallback) prüfen, ob die generierte `uid` oder E-Mail bereits in `getUsersDb()` existiert. Falls ja, Fehler werfen.

---

### Task 1.2: Funktion "Passwort vergessen" aktivieren
- **Betroffene Dateien**: 
  - `src/app/components/auth/auth.component.ts`
  - `src/app/services/auth.service.ts`
- **Ziel**: 
  Echtes Anfordern einer Passwort-Zurücksetzen-E-Mail bei Firebase.
- **Konkrete Schritte**:
  1. In `auth.service.ts` eine Methode `resetPassword(email: string): Promise<void>` hinzufügen, die `sendPasswordResetEmail(this.afAuth, email)` aufruft.
  2. In `auth.component.ts` beim Klick auf "Vergessen?" ein Eingabefeld oder Modal zur E-Mail-Eingabe öffnen.
  3. Erfolgs- oder Fehlermeldung im Auth-Banner anzeigen ("E-Mail zum Zurücksetzen wurde versendet").

---

### Task 1.3: Sauberes Beenden von Firestore-Listenern beim Logout
- **Betroffene Dateien**: 
  - `src/app/services/friends.service.ts`
  - `src/app/components/dashboard/dashboard.component.ts`
  - `src/app/services/auth.service.ts`
- **Ziel**: 
  Keine weiterlaufenden `onSnapshot`-Subscriptionen nach dem Abmelden.
- **Konkrete Schritte**:
  1. `FriendsService` um eine Methode `cleanupSubscriptions()` erweitern, die `unsub1()` und `unsub2()` aufruft.
  2. `AuthService.logout()` anpassen, sodass vor dem Zurücksetzen von `currentUser` die Cleanup-Methoden von `FriendsService` und `DashboardComponent` aufgerufen werden.

---

## Paket 2: Trainingsplan-Verwaltung

### Task 2.1: Default-Sichtbarkeit aus Benutzereinstellungen für neue Pläne übernehmen
- **Betroffene Dateien**: 
  - `src/app/components/plans/plans.component.ts`
- **Ziel**: 
  Die Checkbox "Öffentlich teilen" übernimmt beim Erstellen eines neuen Plans die Einstellung des Benutzers.
- **Konkrete Schritte**:
  1. In `plans.component.ts` `AuthService` injizieren.
  2. In `startCreateNewPlan()` den Initialwert von `editIsPublic` wie folgt setzen:
     `this.editIsPublic = this.authService.currentUser()?.privacySettings?.plansVisibility === 'public';`

---

### Task 2.2: Schutz beim Löschen von Plänen mit aktiver Workout-Session
- **Betroffene Dateien**: 
  - `src/app/components/plans/plans.component.ts`
- **Ziel**: 
  Verhinderung verwaister aktiver Workouts beim Löschen eines Plans.
- **Konkrete Schritte**:
  1. In `plans.component.ts` vor Ausführen von `deletePlan(planId)` prüfen, ob `workoutService.activeWorkout()?.planId === planId`.
  2. Falls ja, Warnhinweis anzeigen: "Für diesen Plan läuft aktuell eine Trainingseinheit. Beim Löschen des Plans wird auch das laufende Training abgebrochen."
  3. Bei Zustimmung zusätzlich `workoutService.clearActiveWorkout()` aufrufen.

---

## Paket 3: Trainingsdurchführung & Live-Session

### Task 3.1: Warnung vor dem Überschreiben laufender Workouts
- **Betroffene Dateien**: 
  - `src/app/components/workout/workout.component.ts`
  - `src/app/components/plans/plans.component.ts`
- **Ziel**: 
  Kein stummes Überschreiben einer aktiven Trainingseinheit beim Starten eines neuen Plans.
- **Konkrete Schritte**:
  1. In `workout.component.ts` / `initializeWorkout()` prüfen: Wenn bereits eine aktive Session für eine *andere* `planId` existiert, vor dem Zurücksetzen nachfragen: `"Du hast bereits ein laufendes Training für '[Plan-Name]'. Möchtest du dieses abbrechen und das neue Training starten?"`
  2. Bei Ablehnung zur vorherigen Ansicht zurücknavigieren.

---

### Task 3.2: Automatische Erfassung ausgefüllter Sätze beim Beenden
- **Betroffene Dateien**: 
  - `src/app/components/workout/workout.component.ts`
- **Ziel**: 
  Eingetragene Gewichte und Wiederholungen gehen nicht verloren, wenn der Nutzer das Häkchen ("✓") vor dem Beenden nicht angeklickt hat.
- **Konkrete Schritte**:
  1. In `workout.component.ts` / `finishWorkout()` das Filtern der absolvierten Sätze anpassen:
     Ein Satz gilt als einzuschließen, wenn `s.completed || (s.reps > 0 && s.weight >= 0)`.
  2. Beim Zusammenstellen der `loggedExercises` diese Sätze automatisch als `completed = true` werten.

---

## Paket 4: Social, Freundschaften & Nutzersuche

### Task 4.1: Behebung des Doppel-Freundschafts-Bugs
- **Betroffene Dateien**: 
  - `src/app/services/friends.service.ts`
- **Ziel**: 
  Höchstens eine aktive Freundschaft oder Anfrage pro Nutzerpaar durch deterministische Dokument-IDs.
- **Konkrete Schritte**:
  1. In `friends.service.ts` die ID-Generierung in `sendFriendRequest` anpassen:
     `const friendshipId = 'friendship_' + [user.uid, targetUserId].sort().join('_');`
  2. Vor dem Erstellen prüfen, ob das Dokument bereits existiert. Wenn eine Gegenanfrage vorliegt (`status: 'pending'`), diese direkt in den Status `'accepted'` überführen, statt eine neue Anfrage anzulegen.

---

### Task 4.2: Freund-Entfernen-Funktion in der Freundesliste
- **Betroffene Dateien**: 
  - `src/app/services/friends.service.ts`
  - `src/app/components/friends/friends.component.ts`
- **Ziel**: 
  Bestehende Freundschaften können aufgelöst werden.
- **Konkrete Schritte**:
  1. In `friends.service.ts` eine Methode `removeFriend(friendshipId: string): Promise<void>` implementieren, die das Firestore-Dokument `friends/${friendshipId}` löscht und das lokale Signal `_friends` aktualisiert.
  2. In `friends.component.ts` auf den Freundeskarten im Reiter "Meine Freunde" einen Button "Freund entfernen" hinzufügen.
  3. Bei Klick `confirm("Möchtest du [Name] aus deinen Freunden entfernen?")` ausführen und `removeFriend()` aufrufen.

---

### Task 4.3: Privatsphäre & Freundesstatus in der Nutzersuche beachten
- **Betroffene Dateien**: 
  - `src/app/services/friends.service.ts`
  - `src/app/components/friends/friends.component.ts`
- **Ziel**: 
  Nutzer mit `showInSearch = false` werden verborgen; bestehende Freunde werden als solche gekennzeichnet.
- **Konkrete Schritte**:
  1. In `friends.service.ts` / `searchUsers()` Ergebnisse filtern: Nutzer ausschließen, bei denen `u.privacySettings?.showInSearch === false`.
  2. In `friends.component.ts` die Trefferliste im Reiter "Freunde suchen" prüfen: Wenn eine ID bereits in `friends()` oder `sentRequests()` existiert, den Button "Anfrage senden" durch ein Badge "Bereits befreundet" bzw. "Anfrage gesendet" ersetzen.

---

## Paket 5: Aktivitätsfeed & Privatsphäre

### Task 5.1: Striktes Filtern des Aktivitätsfeeds (Keine fremden Nutzer)
- **Betroffene Dateien**: 
  - `src/app/components/dashboard/dashboard.component.ts`
- **Ziel**: 
  Feed zeigt niemals Aktivitäten wildfremder Nutzer an.
- **Konkrete Schritte**:
  1. In `dashboard.component.ts` / `loadActivityFeed()` den Snapshot-Filter anpassen:
     Die Bedingung `|| friendIds.size <= 1` ersatzlos entfernen.
  2. Es dürfen ausschließlich Items durchgelassen werden, bei denen `item.userId === userId || friendIds.has(item.userId)`.

---

### Task 5.2: Ausblenden von privaten Workouts im Feed
- **Betroffene Dateien**: 
  - `src/app/services/workout.service.ts`
- **Ziel**: 
  Workouts, die auf einem privaten Plan basieren (`isPublic === false`), erscheinen nicht im Aktivitätsfeed.
- **Konkrete Schritte**:
  1. In `workout.service.ts` in der Methode `logWorkout(log: WorkoutLog)` den Aufruf von `addToActivityFeed(log, xpGained)` mit einer Prüfung umgeben:
     1. Den zugehörigen Plan via `log.planId` aus den Plänen ermitteln.
     2. Falls der Plan exisitert und `isPublic === false` ist, `addToActivityFeed` **nicht** ausführen.

---

## Paket 6: Dashboard, KPIs & Statistiken

### Task 6.1: Korrektur der Streak-Beschriftung im UI
- **Betroffene Dateien**: 
  - `src/app/components/dashboard/dashboard.component.ts`
- **Ziel**: 
  Korrekt beschrifteter Tages-Streak im Dashboard.
- **Konkrete Schritte**:
  1. Im HTML-Template von `dashboard.component.ts` beim Streak-Widget das Label `<span class="highlighter-yellow ...">WOCHEN</span>` durch `<span class="highlighter-yellow ...">TAGE</span>` ersetzen.

---

### Task 6.2: Dynamische Übungsauswertung im Kraftzuwachs-Diagramm
- **Betroffene Dateien**: 
  - `src/app/components/dashboard/dashboard.component.ts`
- **Ziel**: 
  Kraftzuwachs-Diagramm zeigt automatisch die meistabsolvierten Übungen des Nutzers statt starrer Strings ("squat", "bankdrücken").
- **Konkrete Schritte**:
  1. In `strengthChartData` ein `computed()` Hilfssignal erstellen, das alle absolvierten Übungsnamen aus `logs()` zählt und die Top 2 Übungsnamen ermittelt.
  2. Falls weniger als 2 Übungen existieren, Fallback-Namen aus den ersten verfügbaren Logs nehmen.
  3. Die Datasets des Chart.js-Diagramms dynamisch aus den ermittelten 2 Hauptübungen generieren.

---

## Paket 7: Einstellungen & System-Cleanup

### Task 7.1: Durchsetzung aller Privatsphäre-Einstellungen im System
- **Betroffene Dateien**: 
  - `src/app/components/settings/settings.component.ts`
  - `src/app/services/auth.service.ts`
- **Ziel**: 
  Vollständige Wirksamkeit aller Privacy-Schalter (`profileVisibility`, `plansVisibility`, `showInSearch`).
- **Konkrete Schritte**:
  1. Verifizieren, dass `updatePrivacySettings()` in `AuthService` das `user.privacySettings`-Objekt korrekt in `localStorage` und Firestore speichert.
  2. Sicherstellen, dass die Tasks 2.1 (`plansVisibility`) und 4.3 (`showInSearch`) sauber integriert sind.

---

### Task 7.2: Bereinigung aktiver Sessions beim Konto-Reset
- **Betroffene Dateien**: 
  - `src/app/services/workout.service.ts`
- **Ziel**: 
  Beim Zurücksetzen des Kontos werden auch eventuell im Hintergrund laufende aktive Workouts gelöscht.
- **Konkrete Schritte**:
  1. In `workout.service.ts` / `clearLogs()` explizit `this.clearActiveWorkout()` aufrufen.

---

## Übersichtstabelle der Aufgaben & Prioritäten

| Task # | Bereich | Kurzbeschreibung | Priorität | Betroffene Datei(en) |
|---|---|---|---|---|
| **4.1** | Social | Doppel-Freundschafts-Bug (Deterministische ID) | 🔴 Hoch | `friends.service.ts` |
| **5.1** | Feed | Aktivitätsfeed strikt auf Freunde filtern | 🔴 Hoch | `dashboard.component.ts` |
| **2.1** | Pläne | Plan-Sichtbarkeit aus Einstellungen übernehmen | 🔴 Hoch | `plans.component.ts` |
| **3.2** | Workout | Ausgefüllte ungehakte Sätze beim Beenden mitzählen | 🟡 Mittel | `workout.component.ts` |
| **5.2** | Feed | Private Workouts nicht im Feed posten | 🟡 Mittel | `workout.service.ts` |
| **6.1** | Dashboard | Streak-Beschriftung von "WOCHEN" zu "TAGE" korrigieren | 🟡 Mittel | `dashboard.component.ts` |
| **6.2** | Dashboard | Kraft-Diagramm auf Top-2-Übungen dynamisieren | 🟡 Mittel | `dashboard.component.ts` |
| **4.2** | Social | "Freund entfernen"-Button in Freundesliste | 🟡 Mittel | `friends.service.ts`, `friends.component.ts` |
| **4.3** | Social | Privatsphäre `showInSearch` in Nutzersuche beachten | 🟡 Mittel | `friends.service.ts`, `friends.component.ts` |
| **1.1** | Auth | Passwortbestätigung bei Registrierung | 🟢 Niedrig | `auth.component.ts`, `auth.service.ts` |
| **1.2** | Auth | "Passwort vergessen"-Funktion aktivieren | 🟢 Niedrig | `auth.component.ts`, `auth.service.ts` |
| **1.3** | Auth | Cleanup von Firestore-Subscriptions beim Logout | 🟢 Niedrig | `friends.service.ts`, `auth.service.ts` |
| **2.2** | Pläne | Warnung beim Löschen von Plänen mit aktiven Workouts | 🟢 Niedrig | `plans.component.ts` |
| **3.1** | Workout | Warnung vor Überschreiben laufender Workouts | 🟢 Niedrig | `workout.component.ts` |
| **7.2** | Settings | Aktive Workouts beim Konto-Reset löschen | 🟢 Niedrig | `workout.service.ts` |
