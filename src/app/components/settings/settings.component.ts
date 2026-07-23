import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { WorkoutService } from '../../services/workout.service';
import { MockDataService } from '../../services/mock-data.service';
import { UserPrivacySettings } from '../../models/gym.models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-3 sm:p-5 md:p-6 max-w-4xl mx-auto space-y-5 animate-fade-in font-body">
      
      <!-- Header -->
      <div class="pb-2 border-b border-[#2D3748]/20 flex items-center justify-between">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold font-heading text-[#1A1A1A]">
            <span class="highlighter-line inline-block px-1">EINSTELLUNGEN & OPTIONEN</span>
          </h1>
          <p class="text-xs sm:text-sm text-[#718096] font-body mt-0.5">Verwalte dein Konto, Privatsphäre & Speicher-Optionen.</p>
        </div>
      </div>

      <!-- Toast Feedback -->
      @if (toastMessage()) {
        <div class="p-3 rounded-xl bg-[#FEF08A] border border-[#2D3748] text-[#1A1A1A] text-sm font-bold font-heading flex items-center justify-between shadow-sm animate-fade-in">
          <div class="flex items-center gap-2">
            <img src="assets/icons/Form-Validation-Check-Circle--Streamline-Freehand.png" class="w-5 h-5 object-contain" alt="OK" />
            <span>{{ toastMessage() }}</span>
          </div>
          <button (click)="toastMessage.set(null)" class="text-[#2D3748] hover:text-black text-xs font-bold">✕</button>
        </div>
      }

      @if (currentUser(); as user) {
        
        <!-- SECTION 1: KONTO & PROFIL -->
        <div class="notebook-card p-5 sm:p-6 rounded-2xl space-y-4">
          <div class="flex items-center gap-3 border-b border-[#2D3748]/15 pb-3">
            <div class="p-2 rounded-xl bg-[#FEF08A] border border-[#2D3748]/30">
              <img src="assets/icons/Settings-Cog--Streamline-Freehand.png" class="w-6 h-6 object-contain" alt="Konto" />
            </div>
            <div>
              <h2 class="text-xl font-bold font-heading text-[#1A1A1A]">KONTO & PROFIL</h2>
              <p class="text-xs text-[#718096]">Deine persönlichen Benutzerdaten verwalten</p>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-[#FAF8F2] p-4 rounded-xl border border-[#2D3748]/15">
            <img [src]="user.photoURL" class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-[#FEF08A] bg-white object-cover shadow-sm shrink-0" alt="Avatar" />
            <div class="space-y-1 text-center sm:text-left flex-1 min-w-0">
              <span class="text-[10px] font-heading font-bold uppercase tracking-wider text-[#718096]">Nutzer-ID</span>
              <p class="text-xs font-body font-bold text-[#1A1A1A] truncate max-w-xs">{{ user.uid }}</p>
              <div class="flex items-center justify-center sm:justify-start gap-2 mt-1">
                <span class="highlighter-yellow text-xs font-bold font-heading text-[#1A1A1A]">LVL {{ user.stats.level }}</span>
                <span class="text-xs text-[#718096]">•</span>
                <span class="text-xs font-bold text-[#2D3748] font-body">{{ user.stats.xp }} XP Gesamt</span>
              </div>
            </div>
          </div>

          <!-- Edit Display Name -->
          <div class="space-y-1.5 pt-1">
            <label class="text-xs font-bold font-heading text-[#1A1A1A]">Anzeigename</label>
            <div class="flex flex-col sm:flex-row gap-2.5">
              <input 
                type="text" 
                [(ngModel)]="editName" 
                class="flex-1 px-3.5 py-2.5 rounded-xl notebook-input font-body text-[#1A1A1A] text-sm border border-[#2D3748]/30"
                placeholder="Dein Anzeigename"
              />
              <button 
                (click)="saveName()"
                class="notebook-btn-primary px-6 py-2.5 rounded-xl text-base font-heading shadow-sm shrink-0"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>

        <!-- SECTION 2: SOCIAL & PRIVATSPHÄRE -->
        <div class="notebook-card p-5 sm:p-6 rounded-2xl space-y-4">
          <div class="flex items-center gap-3 border-b border-[#2D3748]/15 pb-3">
            <div class="p-2 rounded-xl bg-[#FEF08A] border border-[#2D3748]/30">
              <img src="assets/icons/Multiple-Man-Woman--Streamline-Freehand.png" class="w-6 h-6 object-contain" alt="Privatsphäre" />
            </div>
            <div>
              <h2 class="text-xl font-bold font-heading text-[#1A1A1A]">SOCIAL & PRIVATSPHÄRE</h2>
              <p class="text-xs text-[#718096]">Bestimme, wer deine Trainingserfolge und Pläne sehen kann</p>
            </div>
          </div>

          <!-- Profile Visibility -->
          <div class="space-y-2">
            <label class="text-xs font-bold font-heading text-[#1A1A1A] block">Profil-Sichtbarkeit</label>
            <div class="grid grid-cols-3 gap-2.5">
              <button 
                (click)="privacySettings.profileVisibility = 'public'"
                class="p-2.5 rounded-xl border text-xs sm:text-sm font-bold font-heading transition-all text-center"
                [ngClass]="privacySettings.profileVisibility === 'public' ? 'bg-[#FEF08A] border-2 border-[#2D3748] text-[#1A1A1A] shadow-sm' : 'bg-[#FAF8F2] border-[#2D3748]/20 text-[#718096] hover:text-[#1A1A1A]'"
              >
                Jeder
              </button>
              <button 
                (click)="privacySettings.profileVisibility = 'friends'"
                class="p-2.5 rounded-xl border text-xs sm:text-sm font-bold font-heading transition-all text-center"
                [ngClass]="privacySettings.profileVisibility === 'friends' ? 'bg-[#FEF08A] border-2 border-[#2D3748] text-[#1A1A1A] shadow-sm' : 'bg-[#FAF8F2] border-[#2D3748]/20 text-[#718096] hover:text-[#1A1A1A]'"
              >
                Nur Freunde
              </button>
              <button 
                (click)="privacySettings.profileVisibility = 'private'"
                class="p-2.5 rounded-xl border text-xs sm:text-sm font-bold font-heading transition-all text-center"
                [ngClass]="privacySettings.profileVisibility === 'private' ? 'bg-[#FEF08A] border-2 border-[#2D3748] text-[#1A1A1A] shadow-sm' : 'bg-[#FAF8F2] border-[#2D3748]/20 text-[#718096] hover:text-[#1A1A1A]'"
              >
                Niemand
              </button>
            </div>
          </div>

          <!-- Plan Visibility -->
          <div class="space-y-2 pt-1">
            <label class="text-xs font-bold font-heading text-[#1A1A1A] block">Standard-Sichtbarkeit neuer Pläne</label>
            <div class="grid grid-cols-3 gap-2.5">
              <button 
                (click)="privacySettings.plansVisibility = 'public'"
                class="p-2.5 rounded-xl border text-xs sm:text-sm font-bold font-heading transition-all text-center"
                [ngClass]="privacySettings.plansVisibility === 'public' ? 'bg-sky-200 border-2 border-[#2D3748] text-[#1A1A1A] shadow-sm' : 'bg-[#FAF8F2] border-[#2D3748]/20 text-[#718096] hover:text-[#1A1A1A]'"
              >
                Öffentlich
              </button>
              <button 
                (click)="privacySettings.plansVisibility = 'friends'"
                class="p-2.5 rounded-xl border text-xs sm:text-sm font-bold font-heading transition-all text-center"
                [ngClass]="privacySettings.plansVisibility === 'friends' ? 'bg-sky-200 border-2 border-[#2D3748] text-[#1A1A1A] shadow-sm' : 'bg-[#FAF8F2] border-[#2D3748]/20 text-[#718096] hover:text-[#1A1A1A]'"
              >
                Nur Freunde
              </button>
              <button 
                (click)="privacySettings.plansVisibility = 'private'"
                class="p-2.5 rounded-xl border text-xs sm:text-sm font-bold font-heading transition-all text-center"
                [ngClass]="privacySettings.plansVisibility === 'private' ? 'bg-sky-200 border-2 border-[#2D3748] text-[#1A1A1A] shadow-sm' : 'bg-[#FAF8F2] border-[#2D3748]/20 text-[#718096] hover:text-[#1A1A1A]'"
              >
                Privat
              </button>
            </div>
          </div>

          <!-- Search Visibility Checkbox -->
          <div class="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF8F2] border border-[#2D3748]/15">
            <div>
              <span class="text-sm font-bold font-heading text-[#1A1A1A] block">In Nutzersuche auffindbar</span>
              <span class="text-xs text-[#718096] font-body">Erlaube anderen Athleten, dich über die Suche zu finden</span>
            </div>
            <input 
              type="checkbox" 
              [(ngModel)]="privacySettings.showInSearch" 
              class="w-5 h-5 accent-[#FEF08A] rounded cursor-pointer"
            />
          </div>

          <button 
            (click)="savePrivacy()"
            class="notebook-btn-primary w-full py-3 rounded-xl text-base font-heading shadow-sm"
          >
            Privatsphäre Speichern
          </button>
        </div>

        <!-- SECTION 3: DATEN-VERWALTUNG & DEV TOOLS -->
        <div class="notebook-card p-5 sm:p-6 rounded-2xl space-y-4">
          <div class="flex items-center gap-3 border-b border-[#2D3748]/15 pb-3">
            <div class="p-2 rounded-xl bg-[#FEF08A] border border-[#2D3748]/30">
              <img src="assets/icons/Copy-Paste-Clipboard--Streamline-Freehand.png" class="w-6 h-6 object-contain" alt="Daten" />
            </div>
            <div>
              <h2 class="text-xl font-bold font-heading text-[#1A1A1A]">DATEN-VERWALTUNG & MOCK DATEN</h2>
              <p class="text-xs text-[#718096]">Testdaten generieren oder Speicher zurücksetzen</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="p-4 rounded-xl bg-[#FAF8F2] border border-[#2D3748]/15 flex flex-col justify-between space-y-3">
              <div>
                <h3 class="text-sm font-bold text-[#1A1A1A] font-heading">Mock-Daten Generieren</h3>
                <p class="text-xs text-[#718096] font-body mt-1">Lädt 3 Monate realistische Test-Logs in dein Konto, um Diagramme & Notizbuch-Statistiken zu füllen.</p>
              </div>
              <button 
                (click)="generateMockData()"
                class="notebook-btn-outline w-full py-2.5 rounded-xl text-sm font-heading border border-[#2D3748]"
              >
                Mock-Daten Laden
              </button>
            </div>

            <div class="p-4 rounded-xl bg-[#FAF8F2] border border-rose-200 flex flex-col justify-between space-y-3">
              <div>
                <h3 class="text-sm font-bold text-rose-700 font-heading">Konto Zurücksetzen</h3>
                <p class="text-xs text-[#718096] font-body mt-1">Löscht sämtliche absolvierten Einheiten und setzt dein Notizbuch auf LVL 1 zurück.</p>
              </div>
              <button 
                (click)="resetAllData()"
                class="w-full py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-800 font-heading font-bold text-sm transition-all"
              >
                Alles Zurücksetzen (Reset)
              </button>
            </div>
          </div>
        </div>

      }

      <!-- Logout Card (Mobile & Desktop) -->
      <div class="notebook-card rounded-2xl p-5 border-2 border-rose-300 bg-rose-50/50 space-y-3">
        <div class="flex items-center gap-2">
          <img src="assets/icons/Logout-Door--Streamline-Freehand.png" class="w-6 h-6 object-contain" alt="Abmelden" />
          <h2 class="text-[#1A1A1A] font-bold font-heading text-lg">Abmelden</h2>
        </div>
        <p class="text-xs text-[#718096] font-body">Melde dich aus deinem Notizbuch-Konto ab, um zum Login-Bildschirm zurückzukehren.</p>
        <button 
          (click)="logout()"
          class="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-heading font-bold text-base transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <img src="assets/icons/Logout-Door--Streamline-Freehand.png" class="w-5 h-5 object-contain invert brightness-200" alt="Abmelden" />
          <span>Jetzt Abmelden</span>
        </button>
      </div>

    </div>
  `,
  styles: []
})
export class SettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private workoutService = inject(WorkoutService);
  private mockDataService = inject(MockDataService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  toastMessage = signal<string | null>(null);

  editName = '';
  privacySettings: UserPrivacySettings = {
    profileVisibility: 'public',
    plansVisibility: 'public',
    showInSearch: true
  };

  ngOnInit() {
    const user = this.currentUser();
    if (user) {
      this.editName = user.displayName;
      if (user.privacySettings) {
        this.privacySettings = { ...user.privacySettings };
      }
    }
  }

  saveName() {
    if (!this.editName.trim()) return;
    this.authService.updateDisplayName(this.editName.trim());
    this.showToast('Anzeigename erfolgreich geändert!');
  }

  savePrivacy() {
    this.authService.updatePrivacySettings(this.privacySettings);
    this.showToast('Privatsphäre-Einstellungen gespeichert!');
  }

  generateMockData() {
    this.mockDataService.generateThreeMonthsMockData();
    this.showToast('3 Monate Test-Trainingsdaten geladen!');
  }

  async resetAllData() {
    if (confirm('Bist du sicher, dass du alle absolvierten Workouts und Statistiken zurücksetzen möchtest?')) {
      await this.workoutService.clearLogs();
      this.showToast('Sämtliche Daten wurden dauerhaft zurückgesetzt.');
    }
  }

  async logout() {
    await this.authService.logout();
    await this.router.navigateByUrl('/auth');
  }

  private showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 4000);
  }
}
