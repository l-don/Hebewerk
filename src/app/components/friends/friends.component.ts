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
    <div class="p-3 sm:p-5 md:p-6 max-w-5xl mx-auto space-y-5 animate-fade-in font-body">
      
      <!-- Header -->
      <div class="pb-2 border-b border-[#2D3748]/20 flex items-center justify-between">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold font-heading text-[#1A1A1A]">
            <span class="highlighter-line inline-block px-1">HEBEWERK FREUNDE & SOCIAL</span>
          </h1>
          <p class="text-xs sm:text-sm text-[#718096] font-body mt-0.5">Vernetze dich mit Athleten, vergleiche deine Hebedaten & teile Pläne.</p>
        </div>
      </div>

      <!-- Toast Notification -->
      @if (toastMessage()) {
        <div class="p-3 rounded-xl bg-[#FEF08A] border border-[#2D3748] text-[#1A1A1A] text-sm font-bold font-heading flex items-center justify-between shadow-sm animate-fade-in">
          <div class="flex items-center gap-2">
            <img src="assets/icons/Form-Validation-Check-Circle--Streamline-Freehand.png" class="w-5 h-5 object-contain" alt="OK" />
            <span>{{ toastMessage() }}</span>
          </div>
          <button (click)="toastMessage.set(null)" class="text-[#2D3748] hover:text-black text-xs font-bold">✕</button>
        </div>
      }

      <!-- Navigation Tabs -->
      <div class="flex border-b border-[#2D3748]/20 pb-3 gap-2 overflow-x-auto">
        <button 
          (click)="activeTab.set('friends')"
          class="px-3.5 py-2 font-heading text-base font-bold transition-all shrink-0 rounded-xl border"
          [ngClass]="activeTab() === 'friends' ? 'bg-[#FEF08A] border-2 border-[#2D3748] text-[#1A1A1A] shadow-sm' : 'bg-[#FAF8F2] border-[#2D3748]/20 text-[#718096] hover:text-[#1A1A1A]'"
        >
          Meine Freunde ({{ friends().length }})
        </button>

        <button 
          (click)="activeTab.set('requests')"
          class="px-3.5 py-2 font-heading text-base font-bold transition-all shrink-0 rounded-xl border flex items-center gap-2"
          [ngClass]="activeTab() === 'requests' ? 'bg-[#FEF08A] border-2 border-[#2D3748] text-[#1A1A1A] shadow-sm' : 'bg-[#FAF8F2] border-[#2D3748]/20 text-[#718096] hover:text-[#1A1A1A]'"
        >
          <span>Eingehend</span>
          @if (pendingRequests().length > 0) {
            <span class="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-bold font-body animate-pulse">
              {{ pendingRequests().length }}
            </span>
          }
        </button>

        <button 
          (click)="activeTab.set('sent')"
          class="px-3.5 py-2 font-heading text-base font-bold transition-all shrink-0 rounded-xl border flex items-center gap-2"
          [ngClass]="activeTab() === 'sent' ? 'bg-[#FEF08A] border-2 border-[#2D3748] text-[#1A1A1A] shadow-sm' : 'bg-[#FAF8F2] border-[#2D3748]/20 text-[#718096] hover:text-[#1A1A1A]'"
        >
          <span>Gesendet</span>
          @if (sentRequests().length > 0) {
            <span class="px-2 py-0.5 rounded-full bg-[#FEF08A] text-[#1A1A1A] border border-[#2D3748]/30 text-[11px] font-bold">
              {{ sentRequests().length }}
            </span>
          }
        </button>

        <button 
          (click)="activeTab.set('search')"
          class="px-3.5 py-2 font-heading text-base font-bold transition-all shrink-0 rounded-xl border"
          [ngClass]="activeTab() === 'search' ? 'bg-[#FEF08A] border-2 border-[#2D3748] text-[#1A1A1A] shadow-sm' : 'bg-[#FAF8F2] border-[#2D3748]/20 text-[#718096] hover:text-[#1A1A1A]'"
        >
          Freunde suchen
        </button>
      </div>

      <!-- TAB 1: MEINE FREUNDE -->
      @if (activeTab() === 'friends') {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          @for (item of friends(); track item.profile.uid) {
            <div class="notebook-card rounded-2xl p-5 space-y-4">
              
              <!-- Friend Header -->
              <div class="flex items-center gap-3.5">
                <img [src]="item.profile.photoURL" class="rounded-full border-2 border-[#FEF08A] bg-[#FAF8F2] shrink-0 object-cover shadow-sm" style="width: 56px; height: 56px;" alt="Avatar" />
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-2">
                    <h3 class="text-xl font-bold font-heading text-[#1A1A1A] truncate">{{ item.profile.displayName }}</h3>
                    <span class="highlighter-yellow text-xs font-bold font-heading uppercase shrink-0 px-2 py-0.5 rounded border border-[#2D3748]/20">
                      LVL {{ item.profile.stats.level }}
                    </span>
                  </div>
                  <div class="flex items-center gap-3 text-xs text-[#718096] font-body mt-1">
                    <span class="font-bold text-[#d97706] flex items-center gap-1">
                      🔥 {{ item.profile.stats.currentStreak }} Wochen
                    </span>
                    <span>•</span>
                    <span class="font-bold text-[#1A1A1A]">{{ item.profile.stats.xp }} XP</span>
                  </div>
                </div>
              </div>

              <!-- Public Plans List of Friend -->
              <div class="space-y-2 border-t border-[#2D3748]/15 pt-3">
                <span class="text-xs font-bold font-heading text-[#1A1A1A] uppercase block">Öffentliche Pläne</span>
                @for (plan of item.publicPlans; track plan.id) {
                  <div class="p-2.5 rounded-xl bg-[#FAF8F2] border border-[#2D3748]/15 flex items-center justify-between gap-3">
                    <div class="min-w-0 flex-1">
                      <h4 class="text-sm font-bold font-heading text-[#1A1A1A] truncate">{{ plan.name }}</h4>
                      <span class="text-xs text-[#718096] font-body block mt-0.5">{{ plan.exercises.length }} Übungen</span>
                    </div>
                    <button 
                      (click)="copyPlan(plan)"
                      class="notebook-btn-primary px-3 py-1.5 rounded-lg text-xs font-heading shrink-0 flex items-center gap-1"
                    >
                      <img src="assets/icons/Copy-Paste-Clipboard--Streamline-Freehand.png" class="w-4 h-4 object-contain" alt="Kopieren" />
                      <span>Kopieren</span>
                    </button>
                  </div>
                } @empty {
                  <p class="text-xs text-[#718096] font-body italic">Keine öffentlichen Pläne freigegeben.</p>
                }
              </div>

            </div>
          } @empty {
            <div class="col-span-2 notebook-card rounded-2xl p-10 text-center bg-[#FAF8F2]">
              <img src="assets/icons/Multiple-Man-Woman--Streamline-Freehand.png" class="w-12 h-12 mx-auto mb-3 opacity-60 object-contain" alt="Freunde" />
              <h3 class="text-lg font-bold font-heading text-[#1A1A1A]">Noch keine Freunde vernetzt</h3>
              <p class="text-xs text-[#718096] font-body mt-1 max-w-sm mx-auto">Wechsle zum Reiter "Freunde suchen", um nach Athleten zu suchen und Freundschaftsanfragen zu senden.</p>
            </div>
          }
        </div>
      }

      <!-- TAB 2: EINGEHENDE ANFRAGEN -->
      @if (activeTab() === 'requests') {
        <div class="space-y-3 max-w-2xl mx-auto">
          @for (req of pendingRequests(); track req.friendshipId) {
            <div class="notebook-card rounded-2xl p-4 flex items-center justify-between gap-4">
              <div class="flex items-center gap-3.5">
                <img [src]="req.requester.photoURL" class="rounded-full border-2 border-[#FEF08A] bg-[#FAF8F2] object-cover shrink-0" style="width: 48px; height: 48px;" alt="Avatar" />
                <div>
                  <h3 class="text-base font-bold font-heading text-[#1A1A1A]">{{ req.requester.displayName }}</h3>
                  <span class="text-xs text-[#718096] font-body">Level {{ req.requester.stats.level }} Athlet</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button 
                  (click)="acceptRequest(req.friendshipId)"
                  class="notebook-btn-primary px-4 py-2 rounded-xl text-sm font-heading shadow-sm"
                >
                  Annehmen
                </button>
                <button 
                  (click)="declineRequest(req.friendshipId)"
                  class="notebook-btn-outline px-4 py-2 rounded-xl text-sm font-heading"
                >
                  Ablehnen
                </button>
              </div>
            </div>
          } @empty {
            <div class="notebook-card rounded-2xl p-10 text-center bg-[#FAF8F2]">
              <img src="assets/icons/Alert-Alarm-Bell--Streamline-Freehand.png" class="w-10 h-10 mx-auto mb-2 opacity-60 object-contain" alt="Anfragen" />
              <h3 class="text-base font-bold font-heading text-[#1A1A1A]">Keine eingehenden Anfragen</h3>
              <p class="text-xs text-[#718096] font-body mt-1">Wenn dir jemand eine Anfrage sendet, erscheint sie an dieser Stelle.</p>
            </div>
          }
        </div>
      }

      <!-- TAB 3: GESENDETE ANFRAGEN & STATUS -->
      @if (activeTab() === 'sent') {
        <div class="space-y-3 max-w-2xl mx-auto">
          @for (req of sentRequests(); track req.friendshipId) {
            <div class="notebook-card rounded-2xl p-4 flex items-center justify-between gap-4">
              <div class="flex items-center gap-3.5">
                <img [src]="req.recipient.photoURL" class="rounded-full border border-[#2D3748]/30 bg-[#FAF8F2] object-cover shrink-0" style="width: 48px; height: 48px;" alt="Avatar" />
                <div>
                  <h3 class="text-base font-bold font-heading text-[#1A1A1A]">{{ req.recipient.displayName }}</h3>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-xs text-[#718096] font-body">Level {{ req.recipient.stats.level }}</span>
                    <span class="highlighter-yellow text-[10px] font-bold font-heading uppercase px-2 py-0.5 rounded border border-[#2D3748]/20">
                      Ausstehend
                    </span>
                  </div>
                </div>
              </div>
              <button 
                (click)="cancelSentRequest(req.friendshipId)"
                class="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 font-heading font-bold rounded-xl text-xs transition-colors"
              >
                Zurückziehen
              </button>
            </div>
          } @empty {
            <div class="notebook-card rounded-2xl p-10 text-center bg-[#FAF8F2]">
              <img src="assets/icons/Multiple-Man-Woman--Streamline-Freehand.png" class="w-10 h-10 mx-auto mb-2 opacity-60 object-contain" alt="Gesendet" />
              <h3 class="text-base font-bold font-heading text-[#1A1A1A]">Keine gesendeten Anfragen</h3>
              <p class="text-xs text-[#718096] font-body mt-1">Hier siehst du den Status deiner abgesendeten Freundschaftsanfragen.</p>
            </div>
          }
        </div>
      }

      <!-- TAB 4: FREUNDE SUCHEN -->
      @if (activeTab() === 'search') {
        <div class="space-y-4 max-w-2xl mx-auto">
          <!-- Search input -->
          <div class="relative">
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (input)="onSearchInput()"
              placeholder="Name oder E-Mail eingeben..." 
              class="w-full px-4 py-3 rounded-xl notebook-input placeholder-[#A0AEC0] font-body text-[#1A1A1A] text-sm pr-10 border border-[#2D3748]/30"
            />
          </div>

          <!-- Results List -->
          <div class="space-y-2.5">
            @for (user of searchResults(); track user.uid) {
              <div class="notebook-card rounded-2xl p-4 flex items-center justify-between gap-4">
                <div class="flex items-center gap-3.5">
                  <img [src]="user.photoURL" class="rounded-full border border-[#2D3748]/30 bg-[#FAF8F2] object-cover shrink-0" style="width: 44px; height: 44px;" alt="Avatar" />
                  <div>
                    <h4 class="text-base font-bold font-heading text-[#1A1A1A]">{{ user.displayName }}</h4>
                    <span class="text-xs text-[#718096] font-body">Level {{ user.stats.level }}</span>
                  </div>
                </div>
                <button 
                  (click)="sendRequest(user.uid, user.displayName)"
                  class="notebook-btn-primary px-4 py-2 rounded-xl text-xs font-heading shadow-sm flex items-center gap-1"
                >
                  <span>Anfrage senden</span>
                </button>
              </div>
            } @empty {
              @if (searchQuery.trim().length >= 2) {
                <div class="p-6 text-center text-[#718096] text-xs font-body notebook-card rounded-2xl bg-[#FAF8F2]">
                  Keine Nutzer unter "{{ searchQuery }}" gefunden.
                </div>
              } @else {
                <div class="p-6 text-center text-[#718096] text-xs font-body notebook-card rounded-2xl bg-[#FAF8F2]">
                  Gib mindestens 2 Zeichen ein, um nach Athleten zu suchen.
                </div>
              }
            }
          </div>
        </div>
      }

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
