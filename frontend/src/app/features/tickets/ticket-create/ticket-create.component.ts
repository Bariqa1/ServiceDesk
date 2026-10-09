import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { I18nService } from '../../../core/services/i18n.service';
import { Category, ServiceEntity } from '../../../core/models/models';

@Component({
  selector: 'app-ticket-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="ticket-create-page max-w-3xl mx-auto animate-fade-in">
      <div class="flex items-center gap-3 mb-5">
        <a routerLink="/tickets" class="btn btn-secondary btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            @if (i18n.isArabic()) {
              <path d="M5 12h14M12 5l7 7-7 7"/>
            } @else {
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            }
          </svg>
          <span>{{ i18n.t('ticketCreate.back') }}</span>
        </a>
        <h1 class="text-xl font-bold tracking-tight">{{ i18n.t('ticketCreate.title') }}</h1>
      </div>

      <div class="card p-6 rounded-xl border">
        @if (errorMessage()) {
          <div class="alert alert-error mb-4 p-3 rounded-lg bg-red-soft text-red text-sm">
            {{ errorMessage() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <!-- Title -->
          <div class="form-group mb-4">
            <label class="form-label font-semibold text-xs text-secondary uppercase block mb-1.5">
              {{ i18n.t('ticketCreate.titleLabel') }}
            </label>
            <input 
              type="text" 
              formControlName="title" 
              [placeholder]="i18n.t('ticketCreate.titlePlaceholder')"
              class="input-field w-full"
            />
          </div>

          <!-- Category & Service Cascade -->
          <div class="grid grid-cols-1 md-grid-cols-2 gap-4 mb-4">
            <div class="form-group">
              <label class="form-label font-semibold text-xs text-secondary uppercase block mb-1.5">
                {{ i18n.t('ticketCreate.categoryLabel') }}
              </label>
              <select formControlName="categoryPublicId" (change)="onCategoryChange()" class="select-field w-full">
                <option value="">{{ i18n.t('ticketCreate.selectCategory') }}</option>
                @for (c of categories(); track c.publicId) {
                  <option [value]="c.publicId">{{ c.name }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="form-label font-semibold text-xs text-secondary uppercase block mb-1.5">
                {{ i18n.t('ticketCreate.serviceLabel') }}
              </label>
              <select formControlName="servicePublicId" class="select-field w-full">
                <option value="">{{ i18n.t('ticketCreate.selectService') }}</option>
                @for (s of services(); track s.publicId) {
                  <option [value]="s.publicId">{{ s.name }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Priority -->
          <div class="form-group mb-4">
            <label class="form-label font-semibold text-xs text-secondary uppercase block mb-1.5">
              {{ i18n.t('ticketCreate.priorityLabel') }}
            </label>
            <select formControlName="priority" (change)="updateSlaPreview()" class="select-field w-full">
              <option value="LOW">{{ i18n.formatPriority('LOW') }} (24h)</option>
              <option value="MEDIUM">{{ i18n.formatPriority('MEDIUM') }} (8h)</option>
              <option value="HIGH">{{ i18n.formatPriority('HIGH') }} (4h)</option>
              <option value="CRITICAL">{{ i18n.formatPriority('CRITICAL') }} (2h)</option>
            </select>
          </div>

          <!-- SLA Commitment Banner -->
          <div class="sla-preview-banner p-3 rounded-lg border mb-4 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="badge" [ngClass]="'badge-priority-' + form.get('priority')?.value?.toLowerCase()">
                {{ i18n.formatPriority(form.get('priority')?.value) }} SLA
              </span>
              <span class="text-secondary">{{ i18n.t('ticketCreate.slaCommitment') }}</span>
              <span class="font-bold">{{ slaResolutionHours() }}</span>
            </div>
            <span class="text-secondary">{{ i18n.t('ticketCreate.slaMonitoring') }}</span>
          </div>

          <!-- Description -->
          <div class="form-group mb-5">
            <label class="form-label font-semibold text-xs text-secondary uppercase block mb-1.5">
              {{ i18n.t('ticketCreate.descLabel') }}
            </label>
            <textarea 
              formControlName="description" 
              rows="4"
              [placeholder]="i18n.t('ticketCreate.descPlaceholder')"
              class="textarea-field w-full"
            ></textarea>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end items-center gap-2.5">
            <a routerLink="/tickets" class="btn btn-secondary btn-sm">{{ i18n.t('common.cancel') }}</a>
            <button type="submit" class="btn btn-primary btn-sm" [disabled]="form.invalid || submitting()">
              @if (submitting()) {
                {{ i18n.t('ticketCreate.submitting') }}
              } @else {
                {{ i18n.t('ticketCreate.submitBtn') }}
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .ticket-create-page {
      max-width: 720px;
      margin: 0 auto;
      padding-bottom: 24px;
    }
    .card {
      background: var(--bg-card);
      border-color: var(--border-subtle);
    }
    .input-field, .select-field, .textarea-field {
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      background: var(--bg-primary);
      color: var(--text-primary);
      padding: 0.6rem 0.75rem;
      font-size: 0.8125rem;
    }
    .input-field:focus, .select-field:focus, .textarea-field:focus {
      outline: none;
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }
    .sla-preview-banner {
      background: var(--bg-surface);
      border-color: var(--border-subtle);
    }
    .bg-red-soft { background: rgba(255, 59, 48, 0.1); }
    .text-red { color: #FF3B30; }
  `]
})
export class TicketCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private router = inject(Router);
  public i18n = inject(I18nService);

  categories = signal<Category[]>([]);
  services = signal<ServiceEntity[]>([]);
  submitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  slaResolutionHours = signal<string>('8 hours');

  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    categoryPublicId: ['', Validators.required],
    servicePublicId: [''],
    priority: ['MEDIUM', Validators.required]
  });

  ngOnInit() {
    this.api.getCategories().subscribe(cats => {
      this.categories.set(cats);
    });
    this.updateSlaPreview();
  }

  onCategoryChange() {
    const catPublicId = this.form.get('categoryPublicId')?.value;
    if (catPublicId) {
      this.api.getServicesByCategory(catPublicId).subscribe(services => {
        this.services.set(services);
      });
    } else {
      this.services.set([]);
    }
    this.form.patchValue({ servicePublicId: '' });
  }

  updateSlaPreview() {
    const p = this.form.get('priority')?.value;
    const isAr = this.i18n.isArabic();
    switch (p) {
      case 'CRITICAL': this.slaResolutionHours.set(isAr ? 'ساعتان (2h)' : '2 hours'); break;
      case 'HIGH': this.slaResolutionHours.set(isAr ? '4 ساعات (4h)' : '4 hours'); break;
      case 'MEDIUM': this.slaResolutionHours.set(isAr ? '8 ساعات (8h)' : '8 hours'); break;
      case 'LOW': this.slaResolutionHours.set(isAr ? '24 ساعة (24h)' : '24 hours'); break;
      default: this.slaResolutionHours.set(isAr ? '8 ساعات' : '8 hours'); break;
    }
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.errorMessage.set(null);

    const val = this.form.value;
    const payload = {
      title: val.title,
      description: val.description,
      priority: val.priority,
      categoryPublicId: val.categoryPublicId,
      servicePublicId: val.servicePublicId || undefined
    };

    this.api.createTicket(payload).subscribe({
      next: (ticket) => {
        this.submitting.set(false);
        this.router.navigate(['/tickets', ticket.publicId]);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to create ticket.');
      }
    });
  }
}
