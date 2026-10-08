import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Category, ServiceEntity } from '../../../core/models/models';

@Component({
  selector: 'app-ticket-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="ticket-create-page max-w-3xl mx-auto animate-fade-in">
      <div class="flex items-center gap-3 mb-6">
        <a routerLink="/tickets" class="btn btn-secondary btn-sm">
          ← العودة للطابور
        </a>
        <h1 class="text-2xl font-bold">إنشاء طلب أو بلاغ عطل جديد</h1>
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
            <label class="form-label font-semibold text-xs text-secondary uppercase block mb-1">
              عنوان البلاغ / الطلب *
            </label>
            <input 
              type="text" 
              formControlName="title" 
              placeholder="مثال: انقطاع الاتصال بشبكة VPN الخاصة بمقر العمل"
              class="input-field w-full"
            />
          </div>

          <!-- Category & Service Cascade -->
          <div class="grid grid-cols-1 md-grid-cols-2 gap-4 mb-4">
            <div class="form-group">
              <label class="form-label font-semibold text-xs text-secondary uppercase block mb-1">
                التصنيف الرئيسي *
              </label>
              <select formControlName="categoryPublicId" (change)="onCategoryChange()" class="select-field w-full">
                <option value="">اختر التصنيف</option>
                @for (c of categories(); track c.publicId) {
                  <option [value]="c.publicId">{{ c.name }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="form-label font-semibold text-xs text-secondary uppercase block mb-1">
                الخدمة الفرعية
              </label>
              <select formControlName="servicePublicId" class="select-field w-full">
                <option value="">اختر الخدمة الفرعية</option>
                @for (s of services(); track s.publicId) {
                  <option [value]="s.publicId">{{ s.name }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Priority -->
          <div class="form-group mb-4">
            <label class="form-label font-semibold text-xs text-secondary uppercase block mb-1">
              مستوى الأولوية والخطورة *
            </label>
            <select formControlName="priority" (change)="updateSlaPreview()" class="select-field w-full">
              <option value="LOW">Low (منخفضة - حل خلال 24 ساعة)</option>
              <option value="MEDIUM">Medium (متوسطة - حل خلال 8 ساعات)</option>
              <option value="HIGH">High (عالية - حل خلال 4 ساعات)</option>
              <option value="CRITICAL">Critical (حرجة - حل خلال ساعتين)</option>
            </select>
          </div>

          <!-- SLA Commitment Banner -->
          <div class="sla-preview-banner p-3 rounded-lg border mb-4 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="badge" [ngClass]="'badge-priority-' + form.get('priority')?.value?.toLowerCase()">
                {{ form.get('priority')?.value }} SLA
              </span>
              <span class="text-secondary">مهلة الحل المستهدفة:</span>
              <span class="font-bold">{{ slaResolutionHours() }}</span>
            </div>
            <span class="text-secondary">المراقبة الآلية للتصعيد مفعلة</span>
          </div>

          <!-- Description -->
          <div class="form-group mb-6">
            <label class="form-label font-semibold text-xs text-secondary uppercase block mb-1">
              تفاصيل البلاغ والأعراض الظاهرة *
            </label>
            <textarea 
              formControlName="description" 
              rows="5"
              placeholder="يرجى ذكر رمز الخطأ، خطوات إعادة المشكلة، وتأثيرها على سير العمل..."
              class="textarea-field w-full"
            ></textarea>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end items-center gap-3">
            <a routerLink="/tickets" class="btn btn-secondary">إلغاء</a>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || submitting()">
              @if (submitting()) {
                جاري الإنشاء...
              } @else {
                إنشاء التذكرة الآن
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .ticket-create-page {
      max-width: 800px;
    }
    .card {
      background: var(--bg-surface);
      border-color: var(--border-subtle);
    }
    .input-field, .select-field, .textarea-field {
      border-radius: 8px;
      border: 1px solid var(--border-subtle);
      background: var(--bg-primary);
      color: var(--text-primary);
      padding: 0.6rem 0.75rem;
      font-size: 0.85rem;
    }
    .input-field:focus, .select-field:focus, .textarea-field:focus {
      outline: none;
      border-color: var(--accent-primary);
    }
    .sla-preview-banner {
      background: var(--bg-surface);
      border-color: var(--border-subtle);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
    }
    .badge-priority-critical { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .badge-priority-high { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .badge-priority-medium { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .badge-priority-low { background: rgba(107, 114, 128, 0.15); color: #8E8E93; }
    .bg-red-soft { background: rgba(239, 68, 68, 0.12); }
    .text-red { color: #ef4444; }
    .md-grid-cols-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    @media (max-width: 768px) {
      .md-grid-cols-2 { grid-template-columns: 1fr; }
    }
  `]
})
export class TicketCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private router = inject(Router);

  categories = signal<Category[]>([]);
  services = signal<ServiceEntity[]>([]);
  submitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  slaResolutionHours = signal<string>('8 ساعات');

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
    switch (p) {
      case 'CRITICAL': this.slaResolutionHours.set('ساعتان (2h)'); break;
      case 'HIGH': this.slaResolutionHours.set('4 ساعات (4h)'); break;
      case 'MEDIUM': this.slaResolutionHours.set('8 ساعات (8h)'); break;
      case 'LOW': this.slaResolutionHours.set('24 ساعة (24h)'); break;
      default: this.slaResolutionHours.set('8 ساعات'); break;
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
        this.errorMessage.set(err.error?.message || 'فشل في إنشاء التذكرة.');
      }
    });
  }
}
