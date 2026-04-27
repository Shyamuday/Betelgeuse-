import { Injectable, signal } from '@angular/core';
import { supabase } from './supabase.client';
import { Role, User } from './models';

@Injectable({ providedIn: 'root' })
export class SupabaseAuthService {
  readonly user = signal<User | null>(null);

  async bootstrapSession() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      this.user.set(null);
      return null;
    }

    return this.loadProfile(data.user.id);
  }

  async signInPatientWithOtp(mobile: string) {
    return supabase.auth.signInWithOtp({ phone: mobile });
  }

  async verifyPatientOtp(name: string, mobile: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: mobile,
      token,
      type: 'sms'
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('Supabase did not return a user.');
    }

    await supabase.from('profiles').upsert({
      id: data.user.id,
      name,
      mobile,
      role: 'PATIENT'
    });

    return this.loadProfile(data.user.id);
  }

  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('Supabase did not return a user.');
    }

    return this.loadProfile(data.user.id);
  }

  async signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  }

  async forgotPassword(email: string) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`
    });
  }

  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      throw error;
    }

    return this.bootstrapSession();
  }

  async logout() {
    await supabase.auth.signOut();
    this.user.set(null);
  }

  dashboardFor(role: Role) {
    if (role === 'ADMIN') {
      return '/admin/dashboard';
    }

    if (role === 'DOCTOR') {
      return '/doctor/dashboard';
    }

    return '/patient/dashboard';
  }

  private async loadProfile(id: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) {
      throw error;
    }

    const user: User = {
      id: data.id,
      name: data.name,
      mobile: data.mobile,
      role: data.role
    };

    this.user.set(user);
    return user;
  }
}
