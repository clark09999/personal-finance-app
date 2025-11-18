import { Transaction, Budget, Summary, Health, Tokens, ApiError, User } from './types/api';

const ACCESS_KEY = 'bf_access_token';
const REFRESH_KEY = 'bf_refresh_token';

const DEFAULT_BASE = typeof window !== 'undefined' && (import.meta as any).env?.VITE_API_URL ? (import.meta as any).env.VITE_API_URL : 'http://localhost:3000';

function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(path, DEFAULT_BASE);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

function parseJsonSafe(res: Response) {
  return res.text().then((t) => {
    try { return t ? JSON.parse(t) : null; } catch { return { message: t }; }
  });
}

class ApiClient {
  base = DEFAULT_BASE;
  private refreshing = false;

  get accessToken() {
    return localStorage.getItem(ACCESS_KEY) || null;
  }
  set accessToken(token: string | null) {
    if (token) localStorage.setItem(ACCESS_KEY, token);
    else localStorage.removeItem(ACCESS_KEY);
  }

  get refreshToken() {
    return localStorage.getItem(REFRESH_KEY) || null;
  }
  set refreshToken(token: string | null) {
    if (token) localStorage.setItem(REFRESH_KEY, token);
    else localStorage.removeItem(REFRESH_KEY);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
  }

  async request(input: RequestInfo, init: RequestInit = {}, retry = true): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string,string> || {}),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const res = await fetch(typeof input === 'string' ? input : input, { ...init, headers, credentials: 'include' });
      if (res.status === 401 && retry) {
        // try refresh
        const refreshed = await this.tryRefresh();
        if (refreshed) {
          return this.request(input, init, false);
        }
        // failed refresh
        this.clearTokens();
        const body = await parseJsonSafe(res);
        const err: ApiError = { message: body?.message || 'Unauthorized', status: 401, details: body };
        throw err;
      }

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        const err: ApiError = { message: data?.message || res.statusText, status: res.status, details: data };
        throw err;
      }

      return data;
    } catch (err: any) {
      if (err && (err as ApiError).status !== undefined) throw err;
      // network or parsing error
      throw { message: err.message || String(err) } as ApiError;
    }
  }

  private async tryRefresh(): Promise<boolean> {
    if (this.refreshing) return false;
    const refresh = this.refreshToken;
    if (!refresh) return false;
    this.refreshing = true;
    try {
      const res = await fetch(buildUrl('/api/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (!res.ok) {
        this.clearTokens();
        return false;
      }
      const data = await res.json();
      if (data?.accessToken) this.accessToken = data.accessToken;
      if (data?.refreshToken) this.refreshToken = data.refreshToken;
      return true;
    } catch (e) {
      this.clearTokens();
      return false;
    } finally {
      this.refreshing = false;
    }
  }

  // Auth
  async login(username: string, password: string): Promise<{ tokens: Tokens; user?: User } | ApiError> {
    try {
      const data = await this.request(buildUrl('/api/auth/login'), { method: 'POST', body: JSON.stringify({ username, password }) });
      if (data?.accessToken) this.accessToken = data.accessToken;
      if (data?.refreshToken) this.refreshToken = data.refreshToken;
      return { tokens: { accessToken: data.accessToken, refreshToken: data.refreshToken }, user: data.user };
    } catch (e: any) {
      return e;
    }
  }

  logout() {
    this.clearTokens();
    try { fetch(buildUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' }); } catch {};
  }

  // Transactions
  async getTransactions(opts?: { limit?: number; start_date?: string; end_date?: string }): Promise<Transaction[] | ApiError> {
    try {
      const url = buildUrl('/api/transactions', {
        limit: opts?.limit,
        start_date: opts?.start_date,
        end_date: opts?.end_date,
      } as any);
      return await this.request(url);
    } catch (e:any) { return e; }
  }

  async createTransaction(payload: { amount: string; type: 'income'|'expense'; categoryId: string; description?: string; date?: string; userId?: string }): Promise<Transaction | ApiError> {
    try {
      const data = await this.request(buildUrl('/api/transactions'), { method: 'POST', body: JSON.stringify(payload) });
      return data as Transaction;
    } catch (e:any) { return e; }
  }

  async updateTransaction(id: string, payload: Partial<Omit<Transaction, 'id'>>): Promise<Transaction | ApiError> {
    try {
      const data = await this.request(buildUrl(`/api/transactions/${id}`), { method: 'PATCH', body: JSON.stringify(payload) });
      return data as Transaction;
    } catch (e:any) { return e; }
  }

  async deleteTransaction(id: string): Promise<void | ApiError> {
    try {
      await this.request(buildUrl(`/api/transactions/${id}`), { method: 'DELETE' });
    } catch (e:any) { return e; }
  }

  // Summary
  async getSummary(opts?: { start_date?: string; end_date?: string }): Promise<Summary | ApiError> {
    try {
      const url = buildUrl('/api/summary', { start_date: opts?.start_date, end_date: opts?.end_date } as any);
      return await this.request(url) as Summary;
    } catch (e:any) { return e; }
  }

  // Budgets
  async getBudgets(): Promise<Budget[] | ApiError> {
    try { return await this.request(buildUrl('/api/budgets')) as Budget[]; } catch (e:any) { return e; }
  }

  async createBudget(payload: { categoryId: string; amount: string; period: string }): Promise<Budget | ApiError> {
    try {
      return await this.request(buildUrl('/api/budgets'), { method: 'POST', body: JSON.stringify(payload) }) as Budget;
    } catch (e:any) { return e; }
  }

  // Export
  async exportData(format: 'json'|'csv' = 'json'): Promise<Blob | ApiError> {
    try {
      const url = buildUrl('/api/export', { format });
      const res = await fetch(url, { method: 'GET', headers: { ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}) } });
      if (!res.ok) { const b = await res.text(); throw { message: b || res.statusText, status: res.status } as ApiError; }
      const blob = await res.blob();
      return blob;
    } catch (e:any) { return e; }
  }

  // Health
  async healthCheck(): Promise<Health | ApiError> {
    try { return await this.request(buildUrl('/health')) as Health; } catch (e:any) { return e; }
  }

  // AI Insights
  /**
   * Request AI insights generation for a date range
   */
  async requestInsights(startDate: string, endDate: string) {
    const data = await this.request(buildUrl('/api/ai/insights'), {
      method: 'POST',
      body: JSON.stringify({ startDate, endDate }),
    });
    return data;
  }

  /**
   * Get latest generated insights
   * Returns null if no insights exist yet
   */
  async getInsights() {
    try {
      const data = await this.request(buildUrl('/api/ai/insights'));
      return data;
    } catch (e: any) {
      if (e && e.status === 404) return null;
      throw e;
    }
  }
}

export const api = new ApiClient();

export default api;
