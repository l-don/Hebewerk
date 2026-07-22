import { Component, inject, OnInit, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { FriendsService } from './services/friends.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private friendsService = inject(FriendsService);
  private router = inject(Router);

  isAuthenticated = this.authService.isAuthenticated;
  currentUser = this.authService.currentUser;
  pendingRequestsCount = computed(() => this.friendsService.pendingRequests().length);

  ngOnInit() {
    // Expose triggerConfetti globally so services can call it
    (window as any).triggerConfetti = () => this.runConfettiEffect();
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/auth']);
  }

  // Pure Canvas Premium Confetti Effect (No packages required)
  private runConfettiEffect() {
    const container = document.getElementById('confetti-container');
    if (!container) return;

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '999';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Confetti particles
    const colors = ['#00f5b8', '#00d2ff', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      color: string;
      speedX: number;
      speedY: number;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
    }> = [];

    // Initialize particles from center or random spots
    const particleCount = 120;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 100,
        y: canvas.height * 0.4 + (Math.random() - 0.5) * 100,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 12,
        speedY: (Math.random() - 0.7) * 15 - 5, // shoot upwards
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let activeParticles = 0;

      particles.forEach(p => {
        if (p.opacity <= 0) return;

        activeParticles++;

        // Physics
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.3; // gravity
        p.speedX *= 0.98; // air resistance
        p.rotation += p.rotationSpeed;
        
        // Fade out as they fall below half height
        if (p.speedY > 0) {
          p.opacity -= 0.015;
        }

        // Draw particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        
        // Alternate shapes: rect and circle
        if (Math.random() > 0.5) {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      });

      if (activeParticles > 0) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        canvas.remove();
        cancelAnimationFrame(animationFrameId);
      }
    };

    animate();

    // Clean up if window resizes
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    setTimeout(() => {
      window.removeEventListener('resize', handleResize);
    }, 4000);
  }
}
