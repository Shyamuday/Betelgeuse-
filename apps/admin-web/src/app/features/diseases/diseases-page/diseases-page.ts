import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { AdminApi } from '../../../core/services/admin-api';
import { CURRENCY_CODE, CURRENCY_LOCALE, PAISE_PER_RUPEE } from '../../../shared/constants/currency.constants';

type Disease = {
  id: string;
  name: string;
  description: string;
  feeInPaise: number;
  isActive: boolean;
  intakeQuestions: string[];
};

function emptyDraft() {
  return { name: '', description: '', feeInPaise: 0, isActive: true, intakeQuestions: [] as string[] };
}

function emptyNew() {
  return { name: '', description: '', feeInPaise: 0, intakeQuestions: [] as string[] };
}

@Component({
  selector: 'app-diseases-page',
  imports: [CommonModule, FormField],
  templateUrl: './diseases-page.html',
  styleUrl: './diseases-page.scss'
})
export class DiseasesPage {
  readonly diseases = signal<Disease[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  editingId = '';
  readonly draftModel = signal(emptyDraft());
  readonly draftForm = form(this.draftModel);
  readonly draftQuestionModel = signal({ value: '' });
  readonly draftQuestionForm = form(this.draftQuestionModel);
  readonly saving = signal(false);
  saveError = '';

  showCreateForm = false;
  readonly newDiseaseModel = signal(emptyNew());
  readonly newDiseaseForm = form(this.newDiseaseModel);
  readonly newQuestionModel = signal({ value: '' });
  readonly newQuestionForm = form(this.newQuestionModel);
  readonly creating = signal(false);
  createError = '';

  constructor(private readonly api: AdminApi) {
    void this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const res = await this.api.getDiseases();
      this.diseases.set(res.diseases || []);
    } catch {
      this.error.set('Could not load diseases.');
    } finally {
      this.loading.set(false);
    }
  }

  startEdit(disease: Disease) {
    this.editingId = disease.id;
    this.draftModel.set({
      name: disease.name,
      description: disease.description,
      feeInPaise: disease.feeInPaise,
      isActive: disease.isActive,
      intakeQuestions: [...disease.intakeQuestions]
    });
    this.draftQuestionModel.set({ value: '' });
    this.saveError = '';
  }

  cancelEdit() {
    this.editingId = '';
    this.draftModel.set(emptyDraft());
    this.draftQuestionModel.set({ value: '' });
    this.saveError = '';
  }

  addDraftQuestion() {
    const q = this.draftQuestionModel().value.trim();
    if (!q) return;
    const draft = this.draftModel();
    this.draftModel.set({ ...draft, intakeQuestions: [...draft.intakeQuestions, q] });
    this.draftQuestionModel.set({ value: '' });
  }

  removeDraftQuestion(index: number) {
    const draft = this.draftModel();
    this.draftModel.set({
      ...draft,
      intakeQuestions: draft.intakeQuestions.filter((_, i) => i !== index)
    });
  }

  async saveEdit() {
    const draft = this.draftModel();
    if (!this.editingId || !draft.name || !draft.description || !draft.feeInPaise) return;
    this.saving.set(true);
    this.saveError = '';
    try {
      await this.api.updateDisease(this.editingId, {
        ...draft,
        feeInPaise: Number(draft.feeInPaise)
      });
      await this.load();
      this.cancelEdit();
    } catch {
      this.saveError = 'Could not save. Please try again.';
    } finally {
      this.saving.set(false);
    }
  }

  addNewQuestion() {
    const q = this.newQuestionModel().value.trim();
    if (!q) return;
    const newDisease = this.newDiseaseModel();
    this.newDiseaseModel.set({ ...newDisease, intakeQuestions: [...newDisease.intakeQuestions, q] });
    this.newQuestionModel.set({ value: '' });
  }

  removeNewQuestion(index: number) {
    const newDisease = this.newDiseaseModel();
    this.newDiseaseModel.set({
      ...newDisease,
      intakeQuestions: newDisease.intakeQuestions.filter((_, i) => i !== index)
    });
  }

  async createDisease() {
    const newDisease = this.newDiseaseModel();
    if (!newDisease.name || !newDisease.description || !newDisease.feeInPaise || !newDisease.intakeQuestions.length) {
      this.createError = 'Fill all fields and add at least one intake question.';
      return;
    }
    this.creating.set(true);
    this.createError = '';
    try {
      await this.api.createDisease({
        ...newDisease,
        feeInPaise: Number(newDisease.feeInPaise)
      });
      this.newDiseaseModel.set(emptyNew());
      this.newQuestionModel.set({ value: '' });
      this.showCreateForm = false;
      await this.load();
    } catch {
      this.createError = 'Could not create disease. Please try again.';
    } finally {
      this.creating.set(false);
    }
  }

  feeToCurrency(paise: number) {
    return (paise / PAISE_PER_RUPEE).toLocaleString(CURRENCY_LOCALE, {
      style: 'currency',
      currency: CURRENCY_CODE,
      maximumFractionDigits: 0
    });
  }
}
