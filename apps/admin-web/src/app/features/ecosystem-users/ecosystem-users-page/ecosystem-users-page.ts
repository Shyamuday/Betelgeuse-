import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApi } from '../../../core/services/admin-api';
import { TOAST_DURATION_LONG_MS } from '../../../core/constants/timing.constants';
import { ECOSYSTEM_ROLE_LABELS, ECOSYSTEM_ROLE_OPTIONS } from '../../../core/constants/platform-roles.constants';

@Component({
  selector: 'app-ecosystem-users-page',
  imports: [FormsModule],
  templateUrl: './ecosystem-users-page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './ecosystem-users-page.scss'
})
export class EcosystemUsersPage implements OnInit {
  private api = inject(AdminApi);

  readonly roleOptions = ECOSYSTEM_ROLE_OPTIONS;
  readonly roleLabels = ECOSYSTEM_ROLE_LABELS;

  users = signal<any[]>([]);
  stores = signal<any[]>([]);
  corporates = signal<any[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  toast = signal('');
  activeRole = signal('ALL');
  modal = signal<'create' | 'edit' | 'corporate' | null>(null);
  selected = signal<any>(null);

  createForm = {
    role: 'BRANCH_OWNER',
    name: '',
    email: '',
    password: '',
    employeeId: '',
    designation: '',
    storeId: '',
    corporateId: '',
    companyName: '',
    companyCode: ''
  };

  editForm = {
    employeeId: '',
    designation: '',
    storeId: '',
    corporateId: '',
    companyName: '',
    companyCode: ''
  };

  corporateForm = { code: '', name: '', contactEmail: '' };

  filteredUsers = computed(() => {
    const role = this.activeRole();
    const list = this.users();
    return role === 'ALL' ? list : list.filter((u) => u.role === role);
  });

  ngOnInit(): void {
    void this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const [meta, usersRes, corporatesRes] = await Promise.all([
        this.api.getEcosystemUsersMeta(),
        this.api.getEcosystemUsers(),
        this.api.getEcosystemCorporates()
      ]);
      this.stores.set(meta.stores);
      this.corporates.set(corporatesRes.accounts);
      this.users.set(usersRes.users);
    } catch {
      this.error.set('Could not load ecosystem users.');
    } finally {
      this.loading.set(false);
    }
  }

  setRoleFilter(role: string) {
    this.activeRole.set(role);
  }

  roleLabel(role: string) {
    return this.roleLabels[role] ?? role;
  }

  profileSummary(user: any): string {
    switch (user.role) {
      case 'BRANCH_OWNER':
        return user.branchOwnerProfile?.store
          ? `${user.branchOwnerProfile.store.name} (${user.branchOwnerProfile.store.code})`
          : 'No branch assigned';
      case 'PATIENT_COORDINATOR':
        return user.patientCoordinatorProfile?.store
          ? `${user.patientCoordinatorProfile.store.name} (${user.patientCoordinatorProfile.store.code})`
          : 'No branch assigned';
      case 'CORPORATE_WELLNESS':
        return user.corporateWellnessProfile?.corporate?.name ?? 'No corporate account';
      case 'INSURANCE_PARTNER':
        return user.insurancePartnerProfile
          ? `${user.insurancePartnerProfile.companyName} (${user.insurancePartnerProfile.companyCode})`
          : '—';
      case 'CALL_CENTER':
        return user.callCenterProfile?.designation ?? 'Call center agent';
      case 'MARKETING':
        return user.marketingProfile?.designation ?? 'Marketing';
      default:
        return user.role;
    }
  }

  needsStore(role: string) {
    return role === 'BRANCH_OWNER' || role === 'PATIENT_COORDINATOR';
  }

  openCreate() {
    this.createForm = {
      role: this.activeRole() === 'ALL' ? 'BRANCH_OWNER' : this.activeRole(),
      name: '',
      email: '',
      password: '',
      employeeId: '',
      designation: '',
      storeId: this.stores()[0]?.id ?? '',
      corporateId: this.corporates()[0]?.id ?? '',
      companyName: '',
      companyCode: ''
    };
    this.error.set('');
    this.modal.set('create');
  }

  openEdit(user: any) {
    this.selected.set(user);
    this.editForm = {
      employeeId:
        user.branchOwnerProfile?.employeeId ??
        user.patientCoordinatorProfile?.employeeId ??
        user.callCenterProfile?.employeeId ??
        user.marketingProfile?.employeeId ??
        '',
      designation:
        user.branchOwnerProfile?.designation ??
        user.patientCoordinatorProfile?.designation ??
        user.callCenterProfile?.designation ??
        user.marketingProfile?.designation ??
        '',
      storeId: user.branchOwnerProfile?.storeId ?? user.patientCoordinatorProfile?.storeId ?? '',
      corporateId: user.corporateWellnessProfile?.corporateId ?? '',
      companyName: user.insurancePartnerProfile?.companyName ?? '',
      companyCode: user.insurancePartnerProfile?.companyCode ?? ''
    };
    this.error.set('');
    this.modal.set('edit');
  }

  openCorporate() {
    this.corporateForm = { code: '', name: '', contactEmail: '' };
    this.error.set('');
    this.modal.set('corporate');
  }

  closeModal() {
    this.modal.set(null);
    this.error.set('');
  }

  async createUser() {
    const f = this.createForm;
    if (!f.name || !f.email || !f.password) {
      this.error.set('Name, email, and password are required.');
      return;
    }
    this.saving.set(true);
    try {
      await this.api.createEcosystemUser({
        role: f.role,
        name: f.name,
        email: f.email,
        password: f.password,
        employeeId: f.employeeId || undefined,
        designation: f.designation || undefined,
        storeId: this.needsStore(f.role) ? f.storeId : undefined,
        corporateId: f.role === 'CORPORATE_WELLNESS' ? f.corporateId : undefined,
        companyName: f.role === 'INSURANCE_PARTNER' ? f.companyName : undefined,
        companyCode: f.role === 'INSURANCE_PARTNER' ? f.companyCode : undefined
      });
      this.showToast('User created.');
      this.closeModal();
      await this.load();
    } catch (e: any) {
      this.error.set(e?.error?.message || 'Create failed.');
    } finally {
      this.saving.set(false);
    }
  }

  async saveEdit() {
    const user = this.selected();
    if (!user) return;
    this.saving.set(true);
    try {
      await this.api.updateEcosystemUser(user.id, {
        employeeId: this.editForm.employeeId || undefined,
        designation: this.editForm.designation || undefined,
        storeId: this.needsStore(user.role) ? this.editForm.storeId : undefined,
        corporateId: user.role === 'CORPORATE_WELLNESS' ? this.editForm.corporateId : undefined,
        companyName: user.role === 'INSURANCE_PARTNER' ? this.editForm.companyName : undefined,
        companyCode: user.role === 'INSURANCE_PARTNER' ? this.editForm.companyCode : undefined
      });
      this.showToast('Profile updated.');
      this.closeModal();
      await this.load();
    } catch (e: any) {
      this.error.set(e?.error?.message || 'Update failed.');
    } finally {
      this.saving.set(false);
    }
  }

  async createCorporate() {
    if (!this.corporateForm.code || !this.corporateForm.name) {
      this.error.set('Code and name are required.');
      return;
    }
    this.saving.set(true);
    try {
      await this.api.createEcosystemCorporate(this.corporateForm);
      this.showToast('Corporate account created.');
      this.closeModal();
      await this.load();
    } catch (e: any) {
      this.error.set(e?.error?.message || 'Create failed.');
    } finally {
      this.saving.set(false);
    }
  }

  async toggleStatus(user: any) {
    try {
      await this.api.setEcosystemUserStatus(user.id, !user.isActive);
      this.showToast(user.isActive ? 'User deactivated.' : 'User activated.');
      await this.load();
    } catch {
      this.showToast('Status update failed.');
    }
  }

  private showToast(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), TOAST_DURATION_LONG_MS);
  }
}
