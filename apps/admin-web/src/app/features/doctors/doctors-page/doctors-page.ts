import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApi } from '../../../core/services/admin-api';

type Doctor = {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  isActive: boolean;
  createdAt?: string;
  doctorProfile?: {
    specialty?: string;
    registrationNo?: string;
    isAvailable?: boolean;
  };
};

@Component({
  selector: 'app-doctors-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './doctors-page.html',
  styleUrl: './doctors-page.scss'
})
export class DoctorsPage {
  doctors: Doctor[] = [];
  pendingDoctors: Doctor[] = [];
  selectedPendingDoctorIds: string[] = [];
  selectedDoctorId = '';

  searchTerm = '';
  pendingSearchTerm = '';
  sortBy: 'name' | 'createdAt' | 'status' = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';

  pageSize = 6;
  doctorsPage = 1;
  pendingPage = 1;

  error = '';
  message = '';

  constructor(private readonly api: AdminApi) {
    void this.load();
  }

  async load() {
    this.error = '';
    try {
      const [allDoctors, pending] = await Promise.all([this.api.getDoctors(), this.api.getPendingDoctors()]);
      this.doctors = allDoctors.doctors || [];
      this.pendingDoctors = pending.pendingDoctors || [];
      this.selectedPendingDoctorIds = [];
      this.selectedDoctorId = this.visibleDoctors()[0]?.id || '';
    } catch {
      this.error = 'Could not load doctors.';
    }
  }

  async approveDoctor(doctorId: string) {
    this.message = '';
    this.error = '';
    try {
      await this.api.approveDoctor(doctorId);
      this.message = 'Doctor approved.';
      await this.load();
    } catch {
      this.error = 'Could not approve doctor.';
    }
  }

  async rejectDoctor(doctorId: string) {
    this.message = '';
    this.error = '';
    try {
      await this.api.rejectDoctor(doctorId);
      this.message = 'Doctor kept as pending/inactive.';
      await this.load();
    } catch {
      this.error = 'Could not update doctor status.';
    }
  }

  togglePendingDoctorSelection(doctorId: string, checked: boolean) {
    if (checked) {
      if (!this.selectedPendingDoctorIds.includes(doctorId)) {
        this.selectedPendingDoctorIds = [...this.selectedPendingDoctorIds, doctorId];
      }
      return;
    }

    this.selectedPendingDoctorIds = this.selectedPendingDoctorIds.filter((id) => id !== doctorId);
  }

  isPendingDoctorSelected(doctorId: string) {
    return this.selectedPendingDoctorIds.includes(doctorId);
  }

  toggleSelectAllVisiblePending(checked: boolean) {
    const visiblePendingIds = this.visiblePendingDoctors().map((doctor) => doctor.id);
    if (checked) {
      this.selectedPendingDoctorIds = Array.from(new Set([...this.selectedPendingDoctorIds, ...visiblePendingIds]));
      return;
    }

    this.selectedPendingDoctorIds = this.selectedPendingDoctorIds.filter((id) => !visiblePendingIds.includes(id));
  }

  allVisiblePendingSelected() {
    const visiblePending = this.visiblePendingDoctors();
    if (!visiblePending.length) {
      return false;
    }

    return visiblePending.every((doctor) => this.selectedPendingDoctorIds.includes(doctor.id));
  }

  async bulkApproveSelected() {
    if (!this.selectedPendingDoctorIds.length) {
      return;
    }

    this.message = '';
    this.error = '';
    try {
      await Promise.all(this.selectedPendingDoctorIds.map((id) => this.api.approveDoctor(id)));
      this.message = `${this.selectedPendingDoctorIds.length} doctors approved.`;
      await this.load();
    } catch {
      this.error = 'Could not complete bulk approve.';
    }
  }

  async bulkRejectSelected() {
    if (!this.selectedPendingDoctorIds.length) {
      return;
    }

    this.message = '';
    this.error = '';
    try {
      await Promise.all(this.selectedPendingDoctorIds.map((id) => this.api.rejectDoctor(id)));
      this.message = `${this.selectedPendingDoctorIds.length} doctors kept pending.`;
      await this.load();
    } catch {
      this.error = 'Could not complete bulk reject.';
    }
  }

  setDoctorsPage(page: number) {
    this.doctorsPage = page;
  }

  setPendingPage(page: number) {
    this.pendingPage = page;
  }

  visibleDoctors() {
    const filtered = this.sortedDoctors(this.filteredDoctors(this.doctors));
    return this.paginate(filtered, this.doctorsPage, this.pageSize);
  }

  visiblePendingDoctors() {
    const filtered = this.sortedDoctors(this.filteredPendingDoctors(this.pendingDoctors));
    return this.paginate(filtered, this.pendingPage, this.pageSize);
  }

  doctorsTotalPages() {
    return Math.max(1, Math.ceil(this.filteredDoctors(this.doctors).length / this.pageSize));
  }

  pendingTotalPages() {
    return Math.max(1, Math.ceil(this.filteredPendingDoctors(this.pendingDoctors).length / this.pageSize));
  }

  doctorsPages() {
    return Array.from({ length: this.doctorsTotalPages() }, (_, index) => index + 1);
  }

  pendingPages() {
    return Array.from({ length: this.pendingTotalPages() }, (_, index) => index + 1);
  }

  selectedDoctorDetails() {
    return this.doctors.find((doctor) => doctor.id === this.selectedDoctorId) || null;
  }

  private filteredDoctors(input: Doctor[]) {
    const search = this.searchTerm.trim().toLowerCase();
    return input.filter((doctor) => {
      const statusOk =
        this.statusFilter === 'ALL' ||
        (this.statusFilter === 'ACTIVE' && doctor.isActive) ||
        (this.statusFilter === 'INACTIVE' && !doctor.isActive);

      if (!statusOk) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [doctor.name, doctor.email || '', doctor.mobile || '', doctor.doctorProfile?.specialty || '']
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  }

  private filteredPendingDoctors(input: Doctor[]) {
    const search = this.pendingSearchTerm.trim().toLowerCase();
    return input.filter((doctor) => {
      if (!search) {
        return true;
      }

      return [doctor.name, doctor.email || '', doctor.mobile || '', doctor.doctorProfile?.specialty || '']
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  }

  private sortedDoctors(input: Doctor[]) {
    const sorted = [...input];
    sorted.sort((a, b) => {
      let left = '';
      let right = '';

      if (this.sortBy === 'createdAt') {
        left = a.createdAt || '';
        right = b.createdAt || '';
      } else if (this.sortBy === 'status') {
        left = a.isActive ? 'ACTIVE' : 'INACTIVE';
        right = b.isActive ? 'ACTIVE' : 'INACTIVE';
      } else {
        left = a.name || '';
        right = b.name || '';
      }

      const compare = left.localeCompare(right);
      return this.sortDirection === 'asc' ? compare : -compare;
    });
    return sorted;
  }

  private paginate<T>(input: T[], page: number, pageSize: number) {
    const start = (Math.max(page, 1) - 1) * pageSize;
    return input.slice(start, start + pageSize);
  }
}
