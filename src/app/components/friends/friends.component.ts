import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FriendsService, FriendWithPlans, PendingRequestDetail, SentRequestDetail } from '../../services/friends.service';
import { UserProfile, WorkoutPlan } from '../../models/gym.models';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight text-white font-display uppercase">Hebewerk Social</h1>
          <p class="text-sm text-slate-400 mt-1">Vernetze dich mit Athleten, vergleiche deine Hebedaten & teile Pläne.</p>
        </div>
      </div>

      <!-- Toast Notification for Actions -->
      @if (toastMessage()) {
        <div class="p-3.5 rounded-xl bg-neon-mint/15 border border-neon-mint/30 text-neon-mint text-sm font-semibold flex items-center justify-between animate-fade-in shadow-lg">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{{ toastMessage() }}</span>
          </div>
          <button (click)="toastMessage.set(null)" class="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      }

      <!-- Navigation Tabs -->
      <div class="flex border-b border-slate-800/80 gap-2 overflow-x-auto">
        <button 
          (click)="activeTab.set('friends')"
          class="px-4 py-3 font-bold text-xs uppercase tracking-wider transition-all border-b-2 shrink-0"
          [ngClass]="activeTab() === 'friends' ? 'border-neon-mint text-neon-mint bg-slate-900/40 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-white'"
        >
          Meine Freunde ({{ friends().length }})
        </button>

        <button 
          (click)="activeTab.set('requests')"
          class="px-4 py-3 font-bold text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 shrink-0"
          [ngClass]="activeTab() === 'requests' ? 'border-neon-mint text-neon-mint bg-slate-900/40 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-white'"
        >
          <span>Eingehend</span>
          @if (pendingRequests().length > 0) {
            <span class="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
              {{ pendingRequests().length }}
            </span>
          }
        </button>

        <button 
          (click)="activeTab.set('sent')"
          class="px-4 py-3 font-bold text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 shrink-0"
          [ngClass]="activeTab() === 'sent' ? 'border-neon-mint text-neon-mint bg-slate-900/40 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-white'"
        >
          <span>Gesendet</span>
          @if (sentRequests().length > 0) {
            <span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
              {{ sentRequests().length }}
            </span>
          }
        </button>

        <button 
          (click)="activeTab.set('search')"
          class="px-4 py-3 font-bold text-xs uppercase tracking-wider transition-all border-b-2 shrink-0"
          [ngClass]="activeTab() === 'search' ? 'border-neon-mint text-neon-mint bg-slate-900/40 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-white'"
        >
          Freunde suchen
        </button>
      </div>

      <!-- TAB 1: MEINE FREUNDE -->
      @if (activeTab() === 'friends') {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          @for (item of friends(); track item.profile.uid) {
            <div class="glass-card rounded-2xl p-6 space-y-5">
              
              <!-- Friend Header -->
              <div class="flex items-center gap-4">
                <img [src]="item.profile.photoURL" class="w-14 h-14 rounded-full border-2 border-neon-cyan bg-slate-800 shrink-0" alt="Avatar" />
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-bold text-white truncate">{{ item.profile.displayName }}</h3>
                    <span class="text-[10px] px-2 py-0.5 rounded bg-neon-mint/10 border border-neon-mint/20 text-neon-mint font-extrabold uppercase">
                      Lvl {{ item.profile.stats.level }}
                    </span>
                  </div>
                  <div class="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span class="flex items-center gap-1 text-amber-400 font-bold">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-1.348l-3.75 3.75a1 1 0 00-.272.548l-.8 4a1 1 0 001.214 1.214l4-.8a1 1 0 00.548-.272l3.75-3.75a1 1 0 00-1.348-1.45L12 6.586l.395-4.033z" clip-rule="evenodd" />
                      </svg>
                      {{ item.profile.stats.currentStreak }} Wochen
                    </span>
                    <span>{{ item.profile.stats.xp }} XP</span>
                  </div>
                </div>
              </div>

              <!-- Public Plans List of Friend -->
              <div class="space-y-2 border-t border-slate-800/60 pt-4">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Öffentliche Pläne</span>
                @for (plan of item.publicPlans; track plan.id) {
                  <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-900 flex items-center justify-between gap-3">
                    <div class="min-w-0 flex-1">
                      <h4 class="text-xs font-bold text-slate-200 truncate">{{ plan.name }}</h4>
                      <span class="text-[10px] text-slate-500 block mt-0.5">{{ plan.exercises.length }} Übungen</span>
                    </div>
                    <button 
                      (click)="copyPlan(plan)"
                      class="px-3 py-1.5 bg-neon-cyan/15 hover:bg-neon-cyan/25 border border-neon-cyan/30 text-neon-cyan font-bold rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Kopieren</span>
                    </button>
                  </div>
                } @empty {
                  <p class="text-xs text-slate-500 italic">Keine öffentlichen Pläne freigegeben.</p>
                }
              </div>

            </div>
          } @empty {
            <div class="col-span-2 glass-card rounded-2xl p-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 class="text-lg font-bold text-slate-300">Noch keine Freunde vernetzt</h3>
              <p class="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Wechsle zum Reiter "Freunde suchen", um nach Athleten zu suchen und Freundschaftsanfragen zu senden.</p>
            </div>
          }
        </div>
      }

      <!-- TAB 2: EINGEHENDE ANFRAGEN -->
      @if (activeTab() === 'requests') {
        <div class="space-y-4 max-w-2xl mx-auto">
          @for (req of pendingRequests(); track req.friendshipId) {
            <div class="glass-card rounded-2xl p-5 flex items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                <img [src]="req.requester.photoURL" class="w-12 h-12 rounded-full border border-neon-mint bg-slate-800 shrink-0" alt="Avatar" />
                <div>
                  <h3 class="text-base font-bold text-white">{{ req.requester.displayName }}</h3>
                  <span class="text-xs text-slate-400">Level {{ req.requester.stats.level }} Athlet</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button 
                  (click)="acceptRequest(req.friendshipId)"
                  class="px-4 py-2 bg-gradient-accent text-slate-950 font-bold rounded-xl text-xs hover:brightness-110 active:scale-95 transition-all shadow-md glow-mint"
                >
                  Annehmen
                </button>
                <button 
                  (click)="declineRequest(req.friendshipId)"
                  class="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 font-semibold rounded-xl text-xs transition-colors"
                >
                  Ablehnen
                </button>
              </div>
            </div>
          } @empty {
            <div class="glass-card rounded-2xl p-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h3 class="text-base font-bold text-slate-300">Keine eingehenden Anfragen</h3>
              <p class="text-xs text-slate-500 mt-1">Wenn dir jemand eine Anfrage sendet, erscheint sie an dieser Stelle.</p>
            </div>
          }
        </div>
      }

      <!-- TAB 3: GESENDETE ANFRAGEN & STATUS -->
      @if (activeTab() === 'sent') {
        <div class="space-y-4 max-w-2xl mx-auto">
          @for (req of sentRequests(); track req.friendshipId) {
            <div class="glass-card rounded-2xl p-5 flex items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                <img [src]="req.recipient.photoURL" class="w-12 h-12 rounded-full border border-slate-700 bg-slate-800 shrink-0" alt="Avatar" />
                <div>
                  <h3 class="text-base font-bold text-white">{{ req.recipient.displayName }}</h3>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-xs text-slate-400">Level {{ req.recipient.stats.level }}</span>
                    <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold uppercase">
                      Ausstehend
                    </span>
                  </div>
                </div>
              </div>
              <button 
                (click)="cancelSentRequest(req.friendshipId)"
                class="px-4 py-2 bg-slate-900 hover:bg-red-950/30 border border-slate-800 hover:border-red-900/40 text-slate-400 hover:text-red-400 font-semibold rounded-xl text-xs transition-colors"
              >
                Zurückziehen
              </button>
            </div>
          } @empty {
            <div class="glass-card rounded-2xl p-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <h3 class="text-base font-bold text-slate-300">Keine gesendeten Anfragen</h3>
              <p class="text-xs text-slate-500 mt-1">Hier siehst du den Status deiner abgesendeten Freundschaftsanfragen.</p>
            </div>
          }
        </div>
      }

      <!-- TAB 4: FREUNDE SUCHEN -->
      @if (activeTab() === 'search') {
        <div class="space-y-6 max-w-2xl mx-auto">
          <!-- Search input -->
          <div class="relative">
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (input)="onSearchInput()"
              placeholder="Name oder E-Mail eingeben..." 
              class="w-full px-5 py-3.5 rounded-2xl glass-input placeholder-slate-500 font-medium text-sm pr-10"
            />
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-500 absolute right-4 top-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <!-- Results List -->
          <div class="space-y-3">
            @for (user of searchResults(); track user.uid) {
              <div class="glass-card rounded-2xl p-4 flex items-center justify-between gap-4">
                <div class="flex items-center gap-3.5">
                  <img [src]="user.photoURL" class="w-11 h-11 rounded-full border border-slate-700 bg-slate-800 shrink-0" alt="Avatar" />
                  <div>
                    <h4 class="text-sm font-bold text-white">{{ user.displayName }}</h4>
                    <span class="text-[11px] text-slate-400">Level {{ user.stats.level }}</span>
                  </div>
                </div>
                <button 
                  (click)="sendRequest(user.uid, user.displayName)"
                  class="px-4 py-2 bg-neon-cyan/15 hover:bg-neon-cyan/25 border border-neon-cyan/30 text-neon-cyan font-bold rounded-xl text-xs transition-colors flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Anfrage senden</span>
                </button>
              </div>
            } @empty {
              @if (searchQuery.trim().length >= 2) {
                <div class="p-8 text-center text-slate-500 text-sm glass-card rounded-2xl">
                  Keine Nutzer unter "{{ searchQuery }}" gefunden.
                </div>
              } @else {
                <div class="p-8 text-center text-slate-500 text-sm glass-card rounded-2xl">
                  Gib mindestens 2 Zeichen ein, um nach Athleten zu suchen.
                </div>
              }
            }
          </div>
        </div>
      }

    </div>
  `,
  styles: []
})
export class FriendsComponent {
  private friendsService = inject(FriendsService);
  private router = inject(Router);

  activeTab = signal<'friends' | 'requests' | 'sent' | 'search'>('friends');
  toastMessage = signal<string | null>(null);

  friends = this.friendsService.friends;
  pendingRequests = this.friendsService.pendingRequests;
  sentRequests = this.friendsService.sentRequests;
  searchResults = this.friendsService.searchResults;

  searchQuery = '';

  onSearchInput() {
    this.friendsService.searchUsers(this.searchQuery);
  }

  async sendRequest(targetUserId: string, targetName: string) {
    await this.friendsService.sendFriendRequest(targetUserId);
    this.showToast(`Freundschaftsanfrage an ${targetName} gesendet!`);
  }

  async acceptRequest(friendshipId: string) {
    await this.friendsService.acceptFriendRequest(friendshipId);
    this.showToast('Freundschaftsanfrage angenommen!');
  }

  async declineRequest(friendshipId: string) {
    await this.friendsService.declineFriendRequest(friendshipId);
    this.showToast('Anfrage abgelehnt.');
  }

  async cancelSentRequest(friendshipId: string) {
    await this.friendsService.cancelSentRequest(friendshipId);
    this.showToast('Abgesendete Anfrage zurückgezogen.');
  }

  copyPlan(plan: WorkoutPlan) {
    this.friendsService.copyPlanToMyPlans(plan);
    this.showToast(`Plan "${plan.name}" erfolgreich in deine Pläne kopiert!`);
  }

  private showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 3500);
  }
}
