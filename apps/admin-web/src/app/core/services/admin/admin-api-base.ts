import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AdminAuth } from '../admin-auth';
import { environment } from '../../../../environments/environment';

@Injectable()
export abstract class AdminApiBase {
  protected readonly apiBase = environment.apiUrl;

  constructor(
    protected readonly http: HttpClient,
    protected readonly auth: AdminAuth
  ) {}
}
