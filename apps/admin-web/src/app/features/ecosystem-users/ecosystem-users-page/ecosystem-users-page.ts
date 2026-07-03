import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { AdminApi } from '../../../core/services/admin-api';
import { TOAST_DURATION_LONG_MS } from '../../../core/constants/timing.constants';
import {
  ECOSYSTEM_ROLE_LABELS,
  ECOSYSTEM_ROLE_OPTIONS,
  STAFF_PORTAL_ROLE_LABELS,
  STAFF_PORTAL_ROLE_OPTIONS,
  PARTNER_PORTAL_ROLE_LABELS,
  PARTNER_PORTAL_ROLE_OPTIONS,
  ALL_PORTAL_ROLE_LABELS
} from '../../../core/constants/platform-roles.constants';

type SectionTab = 'users' | 'corporate' | 'insurance';
type UserPool = 'ecosystem' | 'staff' | 'partner';

@Component({
  selector: 'app-ecosystem-users-page',
  imports: [CommonModule, FormField, DatePipe, DecimalPipe],
  templateUrl: './ecosystem-users-page.html',
  styleUrl: './ecosystem-users-page.scss'
})
export class EcosystemUsersPage implements OnInit {
  private api = inject(AdminApi);

  readonly ecosystemRoleOptions = ECOSYSTEM_ROLE_OPTIONS;
  readonly staffRoleOptions = STAFF_PORTAL_ROLE_OPTIONS;
  readonly partnerRoleOptions = PARTNER_PORTAL_ROLE_OPTIONS;
  readonly roleLabels = ALL_PORTAL_ROLE_LABELS;

  sectionTab = signal<SectionTab>('users');
  userPool = signal<UserPool>('ecosystem');
  users = signal<any[]>([]);
  stores = signal<any[]>([]);
  warehouses = signal<any[]>([]);
  suppliers = signal<any[]>([]);
  diagnosticCenters = signal<any[]>([]);
  corporates = signal<any[]>([]);
  claims = signal<any[]>([]);
  enrollments = signal<any[]>([]);
  patientHits = signal<any[]>([]);

  loading = signal(true);
  saving = signal(false);
  searchingPatients = signal(false);
  error = signal('');
  toast = signal('');
  activeRole = signal('ALL');
  modal = signal<'create' | 'edit' | 'corporate' | 'enroll' | null>(null);
  selected = signal<any>(null);
  selectedCorporateId = signal('');

  readonly createModel = signal({
    role: 'BRANCH_OWNER',
    name: '',
    email: '',
    password: '',
    employeeId: '',
    designation: '',
    storeId: '',
    warehouseId: '',
    supplierId: '',
    diagnosticCenterId: '',
    corporateId: '',
    companyName: '',
    companyCode: ''
  });
  readonly createForm = form(this.createModel);

  readonly editModel = signal({
    employeeId: '',
    designation: '',
    storeId: '',
    warehouseId: '',
    supplierId: '',
    diagnosticCenterId: '',
    corporateId: '',
    companyName: '',
    companyCode: ''
  });
  readonly editForm = form(this.editModel);

  readonly corporateModel = signal({ code: '', name: '', contactEmail: '' });
  readonly corporateForm = form(this.corporateModel);
  readonly enrollQueryModel = signal({ q: '' });
  readonly enrollQueryForm = form(this.enrollQueryModel);
  readonly corporateSelectModel = signal({ corporateId: '' });
  readonly corporateSelectForm = form(this.corporateSelectModel);
  enrollPatientId = '';

  currentRoleOptions = computed(() => {
    switch (this.userPool()) {
      case 'staff':
        return this.staffRoleOptions;
      case 'partner':
        return this.partnerRoleOptions;
      default:
        return this.ecosystemRoleOptions;
    }
  });

  filteredUsers = computed(() => {
    const role = this.activeRole();
    const list = this.users();
    return role === 'ALL' ? list : list.filter((u) => u.role === role);
  });

  selectedCorporate = computed(() => this.corporates().find((c) => c.id === this.selectedCorporateId()) ?? null);

  ngOnInit(): void {
    void this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const tab = this.sectionTab();
      if (tab === 'users') {
        await this.loadUsers();
      } else if (tab === 'corporate') {
        await this.loadCorporateTab();
      } else {
        await this.loadInsuranceTab();
      }
    } catch {
      this.error.set('Could not load portal data.');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadUsers() {
    const pool = this.userPool();
    if (pool === 'ecosystem') {
      const [meta, usersRes, corporatesRes] = await Promise.all([
        this.api.getEcosystemUsersMeta(),
        this.api.getEcosystemUsers(),
        this.api.getEcosystemCorporates()
      ]);
      this.stores.set(meta.stores);
      this.corporates.set(corporatesRes.accounts);
      this.users.set(usersRes.users);
    } else {
      const [meta, usersRes] = await Promise.all([this.api.getPortalUsersMeta(), this.api.getPortalUsers()]);
      this.stores.set(meta.stores);
      this.warehouses.set(meta.warehouses);
      this.suppliers.set(meta.suppliers);
      this.diagnosticCenters.set(meta.diagnosticCenters);
      const roles = pool === 'staff' ? STAFF_PORTAL_ROLE_LABELS : PARTNER_PORTAL_ROLE_LABELS;
      this.users.set(usersRes.users.filter((u) => roles[u.role]));
    }
  }

  private async loadCorporateTab() {
    const corporatesRes = await this.api.getEcosystemCorporates();
    this.corporates.set(corporatesRes.accounts);
    const first = corporatesRes.accounts[0]?.id ?? '';
    this.selectedCorporateId.set(first);
    this.corporateSelectModel.set({ corporateId: first });
    if (first) await this.loadEnrollments(first);
    else this.enrollments.set([]);
  }

  private async loadInsuranceTab() {
    const res = await this.api.getInsuranceClaimsAdmin();
    this.claims.set(res.claims);
  }

  async loadEnrollments(corporateId: string) {
    this.selectedCorporateId.set(corporateId);
    this.corporateSelectModel.set({ corporateId });
    const res = await this.api.getCorporateEnrollments(corporateId);
    this.enrollments.set(res.enrollments);
  }

  setSectionTab(tab: SectionTab) {
    this.sectionTab.set(tab);
    this.activeRole.set('ALL');
    void this.load();
  }

  setUserPool(pool: UserPool) {
    this.userPool.set(pool);
    this.activeRole.set('ALL');
    void this.load();
  }

  setRoleFilter(role: string) {
    this.activeRole.set(role);
  }

  roleLabel(role: string) {
    return this.roleLabels[role] ?? role;
  }

  isPortalUser(user: any) {
    return Boolean(
      user.receptionistProfile ||
        user.clinicManagerProfile ||
        user.accountantProfile ||
        user.supplierProfile ||
        user.warehouseManagerProfile ||
        user.deliveryExecutiveProfile ||
        user.diagnosticCenterProfile
    );
  }

  profileSummary(user: any): string {
    if (user.receptionistProfile?.store) {
      return `${user.receptionistProfile.store.name} (${user.receptionistProfile.store.code})`;
    }
    if (user.clinicManagerProfile?.store) {
      return `${user.clinicManagerProfile.store.name} (${user.clinicManagerProfile.store.code})`;
    }
    if (user.accountantProfile) {
      return user.accountantProfile.designation ?? 'Accountant';
    }
    if (user.supplierProfile?.supplier) {
      return `${user.supplierProfile.supplier.name} (${user.supplierProfile.supplier.code})`;
    }
    if (user.warehouseManagerProfile?.warehouse) {
      return `${user.warehouseManagerProfile.warehouse.name} (${user.warehouseManagerProfile.warehouse.code})`;
    }
    if (user.deliveryExecutiveProfile?.store) {
      return `${user.deliveryExecutiveProfile.store.name} — delivery`;
    }
    if (user.diagnosticCenterProfile?.diagnosticCenter) {
      return `${user.diagnosticCenterProfile.diagnosticCenter.name} (${user.diagnosticCenterProfile.diagnosticCenter.code})`;
    }
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
    return role === 'BRANCH_OWNER' || role === 'PATIENT_COORDINATOR' || role === 'RECEPTIONIST' || role === 'CLINIC_MANAGER' || role === 'DELIVERY_EXECUTIVE';
  }

  needsWarehouse(role: string) {
    return role === 'WAREHOUSE_MANAGER';
  }

  needsSupplier(role: string) {
    return role === 'SUPPLIER';
  }

  needsDiagnostic(role: string) {
    return role === 'DIAGNOSTIC_PARTNER';
  }

  openCreate() {
    const pool = this.userPool();
    const defaultRole =
      pool === 'staff' ? 'RECEPTIONIST' : pool === 'partner' ? 'SUPPLIER' : this.activeRole() === 'ALL' ? 'BRANCH_OWNER' : this.activeRole();
    this.createModel.set({
      role: defaultRole,
      name: '',
      email: '',
      password: '',
      employeeId: '',
      designation: '',
      storeId: this.stores()[0]?.id ?? '',
      warehouseId: this.warehouses()[0]?.id ?? '',
      supplierId: this.suppliers()[0]?.id ?? '',
      diagnosticCenterId: this.diagnosticCenters()[0]?.id ?? '',
      corporateId: this.corporates()[0]?.id ?? '',
      companyName: '',
      companyCode: ''
    });
    this.error.set('');
    this.modal.set('create');
  }

  openEdit(user: any) {
    this.selected.set(user);
    this.editModel.set({
      employeeId:
        user.branchOwnerProfile?.employeeId ??
        user.patientCoordinatorProfile?.employeeId ??
        user.callCenterProfile?.employeeId ??
        user.marketingProfile?.employeeId ??
        user.receptionistProfile?.employeeId ??
        user.clinicManagerProfile?.employeeId ??
        user.accountantProfile?.employeeId ??
        user.warehouseManagerProfile?.employeeId ??
        user.deliveryExecutiveProfile?.employeeId ??
        '',
      designation:
        user.branchOwnerProfile?.designation ??
        user.patientCoordinatorProfile?.designation ??
        user.callCenterProfile?.designation ??
        user.marketingProfile?.designation ??
        user.receptionistProfile?.designation ??
        user.clinicManagerProfile?.designation ??
        user.accountantProfile?.designation ??
        user.warehouseManagerProfile?.designation ??
        user.deliveryExecutiveProfile?.designation ??
        '',
      storeId:
        user.branchOwnerProfile?.storeId ??
        user.patientCoordinatorProfile?.storeId ??
        user.receptionistProfile?.storeId ??
        user.clinicManagerProfile?.storeId ??
        user.deliveryExecutiveProfile?.storeId ??
        '',
      warehouseId: user.warehouseManagerProfile?.warehouseId ?? '',
      supplierId: user.supplierProfile?.supplierId ?? '',
      diagnosticCenterId: user.diagnosticCenterProfile?.diagnosticCenterId ?? '',
      corporateId: user.corporateWellnessProfile?.corporateId ?? '',
      companyName: user.insurancePartnerProfile?.companyName ?? '',
      companyCode: user.insurancePartnerProfile?.companyCode ?? ''
    });
    this.error.set('');
    this.modal.set('edit');
  }

  openCorporate() {
    this.corporateModel.set({ code: '', name: '', contactEmail: '' });
    this.error.set('');
    this.modal.set('corporate');
  }

  openEnroll() {
    this.enrollQueryModel.set({ q: '' });
    this.enrollPatientId = '';
    this.patientHits.set([]);
    this.error.set('');
    this.modal.set('enroll');
  }

  closeModal() {
    this.modal.set(null);
    this.error.set('');
  }

  async createUser() {
    const f = this.createModel();
    if (!f.name || !f.email || !f.password) {
      this.error.set('Name, email, and password are required.');
      return;
    }
    this.saving.set(true);
    try {
      const pool = this.userPool();
      if (pool === 'ecosystem') {
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
      } else {
        await this.api.createPortalUser({
          role: f.role,
          name: f.name,
          email: f.email,
          password: f.password,
          employeeId: f.employeeId || undefined,
          designation: f.designation || undefined,
          storeId: this.needsStore(f.role) ? f.storeId : undefined,
          warehouseId: this.needsWarehouse(f.role) ? f.warehouseId : undefined,
          supplierId: this.needsSupplier(f.role) ? f.supplierId : undefined,
          diagnosticCenterId: this.needsDiagnostic(f.role) ? f.diagnosticCenterId : undefined
        });
      }
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
      const edit = this.editModel();
      const payload = {
        employeeId: edit.employeeId || undefined,
        designation: edit.designation || undefined,
        storeId: this.needsStore(user.role) ? edit.storeId : undefined,
        warehouseId: this.needsWarehouse(user.role) ? edit.warehouseId : undefined,
        supplierId: this.needsSupplier(user.role) ? edit.supplierId : undefined,
        diagnosticCenterId: this.needsDiagnostic(user.role) ? edit.diagnosticCenterId : undefined,
        corporateId: user.role === 'CORPORATE_WELLNESS' ? edit.corporateId : undefined,
        companyName: user.role === 'INSURANCE_PARTNER' ? edit.companyName : undefined,
        companyCode: user.role === 'INSURANCE_PARTNER' ? edit.companyCode : undefined
      };
      if (this.isPortalUser(user)) {
        await this.api.updatePortalUser(user.id, payload);
      } else {
        await this.api.updateEcosystemUser(user.id, payload);
      }
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
    const corporate = this.corporateModel();
    if (!corporate.code || !corporate.name) {
      this.error.set('Code and name are required.');
      return;
    }
    this.saving.set(true);
    try {
      await this.api.createEcosystemCorporate(corporate);
      this.showToast('Corporate account created.');
      this.closeModal();
      await this.load();
    } catch (e: any) {
      this.error.set(e?.error?.message || 'Create failed.');
    } finally {
      this.saving.set(false);
    }
  }

  async searchPatients() {
    const q = this.enrollQueryModel().q.trim();
    if (!q) return;
    this.searchingPatients.set(true);
    try {
      const res = await this.api.searchPatients(q);
      this.patientHits.set(res.patients ?? []);
    } catch {
      this.patientHits.set([]);
    } finally {
      this.searchingPatients.set(false);
    }
  }

  async enrollPatient(patientId?: string) {
    const id = patientId ?? this.enrollPatientId;
    const corporateId = this.selectedCorporateId();
    if (!id || !corporateId) {
      this.error.set('Select a corporate account and patient.');
      return;
    }
    this.saving.set(true);
    try {
      await this.api.enrollCorporatePatient(corporateId, id);
      this.showToast('Patient enrolled.');
      this.closeModal();
      await this.loadEnrollments(corporateId);
    } catch (e: any) {
      this.error.set(e?.error?.message || 'Enrollment failed.');
    } finally {
      this.saving.set(false);
    }
  }

  async removeEnrollment(patientId: string) {
    const corporateId = this.selectedCorporateId();
    if (!corporateId) return;
    try {
      await this.api.removeCorporateEnrollment(corporateId, patientId);
      this.showToast('Enrollment removed.');
      await this.loadEnrollments(corporateId);
    } catch {
      this.showToast('Remove failed.');
    }
  }

  async toggleStatus(user: any) {
    try {
      if (this.isPortalUser(user)) {
        await this.api.setPortalUserStatus(user.id, !user.isActive);
      } else {
        await this.api.setEcosystemUserStatus(user.id, !user.isActive);
      }
      this.showToast(user.isActive ? 'User deactivated.' : 'User activated.');
      await this.load();
    } catch {
      this.showToast('Status update failed.');
    }
  }

  claimStatusLabel(status: string) {
    return status.replace(/_/g, ' ');
  }

  private showToast(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), TOAST_DURATION_LONG_MS);
  }
}
