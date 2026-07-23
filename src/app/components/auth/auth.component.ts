import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-[#F6F4EB] px-4 py-10 relative overflow-hidden font-body">
      
      <!-- Notebook Login Card -->
      <div class="w-full max-w-md notebook-card rounded-2xl p-6 sm:p-8 relative z-10 shadow-xl bg-white border-2 border-[#2D3748]">
        
        <!-- Notebook Logo -->
        <div class="text-center mb-6">
          <img 
            src="assets/logo/notebook_with_dumbell.png" 
            class="w-24 h-24 sm:w-28 sm:h-28 mx-auto object-contain drop-shadow-md mb-2" 
            alt="Hebewerk Notebook Logo" 
          />
          <h1 class="text-3xl sm:text-4xl font-bold tracking-wide font-heading text-[#1A1A1A]">HEBEWERK</h1>
          <div class="mt-1">
            <span class="highlighter-yellow font-heading text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">DEIN TRAININGS-NOTIZBUCH</span>
          </div>
        </div>

        <!-- Form error message -->
        @if (errorMessage()) {
          <div class="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-body flex items-center gap-2">
            <span>⚠️</span>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form (ngSubmit)="onSubmit()" #authForm="ngForm" class="space-y-4">
          @if (isRegisterMode()) {
            <div>
              <label class="block text-xs font-bold text-[#2D3748] uppercase font-heading mb-1">Name</label>
              <input 
                type="text" 
                name="displayName"
                [(ngModel)]="displayName"
                required
                placeholder="Dein Trainingspartner Name" 
                class="w-full px-3.5 py-2.5 rounded-xl notebook-input placeholder-[#A0AEC0] font-body text-[#1A1A1A] text-sm border border-[#2D3748]/30"
              />
            </div>
          }

          <div>
            <label class="block text-xs font-bold text-[#2D3748] uppercase font-heading mb-1">E-Mail Adresse</label>
            <input 
              type="email" 
              name="email"
              [(ngModel)]="email"
              required
              email
              placeholder="name@beispiel.de" 
              class="w-full px-3.5 py-2.5 rounded-xl notebook-input placeholder-[#A0AEC0] font-body text-[#1A1A1A] text-sm border border-[#2D3748]/30"
            />
          </div>

          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="block text-xs font-bold text-[#2D3748] uppercase font-heading">Passwort</label>
              @if (!isRegisterMode()) {
                <a href="javascript:void(0)" class="text-xs text-[#718096] hover:text-black font-body">Vergessen?</a>
              }
            </div>
            <input 
              type="password" 
              name="password"
              [(ngModel)]="password"
              required
              minlength="6"
              placeholder="••••••••" 
              class="w-full px-3.5 py-2.5 rounded-xl notebook-input placeholder-[#A0AEC0] font-body text-[#1A1A1A] text-sm border border-[#2D3748]/30"
            />
          </div>

          <button 
            type="submit" 
            [disabled]="authForm.invalid || isLoading()"
            class="notebook-btn-primary w-full py-3 rounded-xl disabled:opacity-50 disabled:pointer-events-none mt-4 flex items-center justify-center gap-2 text-lg font-heading"
          >
            @if (isLoading()) {
              <div class="w-4 h-4 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin"></div>
              <span>Lade...</span>
            } @else {
              <span>{{ isRegisterMode() ? 'Konto erstellen' : 'Anmelden' }}</span>
            }
          </button>
        </form>

        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-[#2D3748]/20"></div></div>
          <div class="relative flex justify-center text-xs uppercase"><span class="px-3 bg-white text-[#718096] font-heading font-bold">Oder</span></div>
        </div>

        <!-- Google Login -->
        <button 
          type="button"
          (click)="loginWithGoogle()"
          [disabled]="isLoading()"
          class="notebook-btn-outline w-full py-2.5 rounded-xl text-base font-heading flex items-center justify-center gap-3 border border-[#2D3748]"
        >
          <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.4 7.56l3.85 2.99c.9-2.7 3.42-4.51 6.75-4.51z"/>
            <path fill="#4285F4" d="M23.49 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-1.99 3.73-4.92 3.73-8.58z"/>
            <path fill="#FBBC05" d="M5.25 10.55c-.24-.72-.37-1.49-.37-2.28 0-.79.13-1.56.37-2.28L1.4 2.99C.5 4.8 0 6.84 0 9s.5 4.2 1.4 6.01l3.85-3.46z"/>
            <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.1-3.96 1.1-3.33 0-5.85-1.81-6.75-4.51l-3.85 2.99C3.37 20.35 7.35 23 12 23z"/>
          </svg>
          <span>Mit Google anmelden</span>
        </button>

        <!-- Toggle Auth Mode -->
        <p class="text-center text-xs font-body text-[#718096] mt-6">
          {{ isRegisterMode() ? 'Bereits registriert?' : 'Neu bei Hebewerk?' }}
          <a 
            href="javascript:void(0)" 
            (click)="toggleAuthMode()"
            class="highlighter-yellow font-heading font-bold text-[#1A1A1A] ml-1 px-1.5 py-0.5 rounded"
          >
            {{ isRegisterMode() ? 'Hier anmelden' : 'Konto erstellen' }}
          </a>
        </p>
      </div>
    </div>
  `,
  styles: []
})
export class AuthComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isRegisterMode = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Form Fields
  email = '';
  password = '';
  displayName = '';

  toggleAuthMode() {
    this.isRegisterMode.update(val => !val);
    this.errorMessage.set(null);
  }

  async onSubmit() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      if (this.isRegisterMode()) {
        await this.authService.signUpWithEmail(this.email, this.password, this.displayName);
      } else {
        await this.authService.loginWithEmail(this.email, this.password);
      }
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Authentifizierung fehlgeschlagen. Bitte prüfe deine Eingaben.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loginWithGoogle() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.errorMessage.set('Google Login fehlgeschlagen.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
