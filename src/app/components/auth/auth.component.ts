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
    <div class="min-h-screen flex items-center justify-center bg-gradient-dark px-4 py-12 relative overflow-hidden">
      <!-- Ambient background glow spots -->
      <div class="absolute top-1/4 left-1/4 w-72 h-72 bg-neon-cyan/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-mint/10 rounded-full blur-3xl"></div>
      
      <!-- Glassmorphic Login Card -->
      <div class="w-full max-w-md glass-card rounded-2xl p-8 relative z-10">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-accent glow-mint mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-9 w-9 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 class="text-3xl font-extrabold tracking-tight font-display text-gradient">GYM TRACKER</h1>
          <p class="text-sm text-slate-400 mt-2">Definiere deine Ziele, verfolge deinen Fortschritt</p>
        </div>

        <!-- Form error message -->
        @if (errorMessage()) {
          <div class="p-3 mb-4 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form (ngSubmit)="onSubmit()" #authForm="ngForm" class="space-y-5">
          @if (isRegisterMode()) {
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Name</label>
              <input 
                type="text" 
                name="displayName"
                [(ngModel)]="displayName"
                required
                placeholder="Dein Trainingspartner Name" 
                class="w-full px-4 py-3 rounded-xl glass-input placeholder-slate-500 font-medium"
              />
            </div>
          }

          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">E-Mail Adresse</label>
            <input 
              type="email" 
              name="email"
              [(ngModel)]="email"
              required
              email
              placeholder="name@beispiel.de" 
              class="w-full px-4 py-3 rounded-xl glass-input placeholder-slate-500 font-medium"
            />
          </div>

          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Passwort</label>
              @if (!isRegisterMode()) {
                <a href="javascript:void(0)" class="text-xs text-neon-cyan hover:text-neon-mint transition-colors">Vergessen?</a>
              }
            </div>
            <input 
              type="password" 
              name="password"
              [(ngModel)]="password"
              required
              minlength="6"
              placeholder="••••••••" 
              class="w-full px-4 py-3 rounded-xl glass-input placeholder-slate-500 font-medium"
            />
          </div>

          <button 
            type="submit" 
            [disabled]="authForm.invalid || isLoading()"
            class="w-full py-3.5 rounded-xl bg-gradient-accent text-slate-950 font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none glow-mint mt-6 flex items-center justify-center gap-2"
          >
            @if (isLoading()) {
              <div class="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              <span>Lade...</span>
            } @else {
              <span>{{ isRegisterMode() ? 'Konto erstellen' : 'Anmelden' }}</span>
            }
          </button>
        </form>

        <div class="relative my-8">
          <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-800"></div></div>
          <div class="relative flex justify-center text-xs uppercase"><span class="px-3 bg-slate-900 text-slate-400 font-semibold tracking-wide">Oder</span></div>
        </div>

        <!-- Google Login -->
        <button 
          type="button"
          (click)="loginWithGoogle()"
          [disabled]="isLoading()"
          class="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.4 7.56l3.85 2.99c.9-2.7 3.42-4.51 6.75-4.51z"/>
            <path fill="#4285F4" d="M23.49 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-1.99 3.73-4.92 3.73-8.58z"/>
            <path fill="#FBBC05" d="M5.25 10.55c-.24-.72-.37-1.49-.37-2.28 0-.79.13-1.56.37-2.28L1.4 2.99C.5 4.8 0 6.84 0 9s.5 4.2 1.4 6.01l3.85-3.46z"/>
            <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.1-3.96 1.1-3.33 0-5.85-1.81-6.75-4.51l-3.85 2.99C3.37 20.35 7.35 23 12 23z"/>
          </svg>
          <span>Mit Google anmelden</span>
        </button>

        <!-- Toggle Auth Mode -->
        <p class="text-center text-sm text-slate-400 mt-8">
          {{ isRegisterMode() ? 'Bereits registriert?' : 'Neu beim Gym Tracker?' }}
          <a 
            href="javascript:void(0)" 
            (click)="toggleAuthMode()"
            class="text-neon-cyan hover:text-neon-mint font-semibold underline transition-colors ml-1"
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
