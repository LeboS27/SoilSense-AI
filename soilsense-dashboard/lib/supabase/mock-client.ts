/**
 * Drop-in mock Supabase client used when no real Supabase project is
 * configured (no NEXT_PUBLIC_SUPABASE_URL). It implements just enough of the
 * query-builder, auth, and realtime-channel surface for this dashboard to
 * render as a browsable prototype against canned in-memory data.
 *
 * It is intentionally permissive: filters mutate an internal predicate list
 * that is applied against plain JS objects, so chained calls like
 * `.eq().order().limit()` behave the way the real client's thenable
 * query-builder does without needing a real database.
 */

import { mockTables, MOCK_USER, type MockTableName } from "./mock-data";

type Row = Record<string, unknown>;

interface QueryResult {
  data: unknown;
  error: null;
  count: number | null;
}

function getPath(row: Row, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => (acc && typeof acc === "object" ? (acc as Row)[key] : undefined), row);
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "string" && typeof b === "string") {
    const da = Date.parse(a);
    const db = Date.parse(b);
    if (!Number.isNaN(da) && !Number.isNaN(db)) return da - db;
    return a.localeCompare(b);
  }
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

class MockQueryBuilder implements PromiseLike<QueryResult> {
  private rows: Row[];
  private predicates: ((row: Row) => boolean)[] = [];
  private orderField: string | null = null;
  private orderAscending = true;
  private limitCount: number | null = null;
  private rangeFrom: number | null = null;
  private rangeTo: number | null = null;
  private wantHead = false;
  private wantCount = false;
  private singleMode: "single" | "maybeSingle" | null = null;
  private pendingMutation: { type: "insert" | "update" | "delete"; values?: Row | Row[] } | null = null;
  private mutationReturnFields: string[] | null = null;

  constructor(private tableName: MockTableName) {
    this.rows = [...(mockTables[tableName] as unknown as Row[])];
  }

  select(columns?: string, options?: { count?: "exact" | "planned" | "estimated"; head?: boolean }): this {
    if (options?.head) this.wantHead = true;
    if (options?.count) this.wantCount = true;
    if (columns) this.mutationReturnFields = columns.split(",").map((c) => c.trim());
    return this;
  }

  eq(field: string, value: unknown): this {
    this.predicates.push((row) => getPath(row, field) === value);
    return this;
  }

  neq(field: string, value: unknown): this {
    this.predicates.push((row) => getPath(row, field) !== value);
    return this;
  }

  in(field: string, values: unknown[]): this {
    this.predicates.push((row) => values.includes(getPath(row, field)));
    return this;
  }

  is(field: string, value: unknown): this {
    this.predicates.push((row) => getPath(row, field) === value);
    return this;
  }

  not(field: string, operator: string, value: unknown): this {
    if (operator === "is") {
      this.predicates.push((row) => getPath(row, field) !== value);
    } else {
      this.predicates.push((row) => getPath(row, field) !== value);
    }
    return this;
  }

  gte(field: string, value: unknown): this {
    this.predicates.push((row) => compareValues(getPath(row, field), value) >= 0);
    return this;
  }

  gt(field: string, value: unknown): this {
    this.predicates.push((row) => compareValues(getPath(row, field), value) > 0);
    return this;
  }

  lte(field: string, value: unknown): this {
    this.predicates.push((row) => compareValues(getPath(row, field), value) <= 0);
    return this;
  }

  lt(field: string, value: unknown): this {
    this.predicates.push((row) => compareValues(getPath(row, field), value) < 0);
    return this;
  }

  like(field: string, pattern: string): this {
    const re = new RegExp(`^${pattern.replace(/%/g, ".*")}$`, "i");
    this.predicates.push((row) => re.test(String(getPath(row, field) ?? "")));
    return this;
  }

  ilike(field: string, pattern: string): this {
    return this.like(field, pattern);
  }

  order(field: string, options?: { ascending?: boolean }): this {
    this.orderField = field;
    this.orderAscending = options?.ascending !== false;
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number): this {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  single(): this {
    this.singleMode = "single";
    return this;
  }

  maybeSingle(): this {
    this.singleMode = "maybeSingle";
    return this;
  }

  insert(values: Row | Row[]): this {
    this.pendingMutation = { type: "insert", values };
    return this;
  }

  update(values: Row): this {
    this.pendingMutation = { type: "update", values };
    return this;
  }

  upsert(values: Row | Row[]): this {
    this.pendingMutation = { type: "insert", values };
    return this;
  }

  delete(): this {
    this.pendingMutation = { type: "delete" };
    return this;
  }

  private applyFilters(rows: Row[]): Row[] {
    return rows.filter((row) => this.predicates.every((p) => p(row)));
  }

  private finalise(rows: Row[]): Row[] {
    let result = [...rows];
    if (this.orderField) {
      const field = this.orderField;
      const dir = this.orderAscending ? 1 : -1;
      result.sort((a, b) => compareValues(getPath(a, field), getPath(b, field)) * dir);
    }
    if (this.rangeFrom != null && this.rangeTo != null) {
      result = result.slice(this.rangeFrom, this.rangeTo + 1);
    } else if (this.limitCount != null) {
      result = result.slice(0, this.limitCount);
    }
    return result;
  }

  private execute(): QueryResult {
    if (this.pendingMutation) {
      return this.executeMutation();
    }

    const matched = this.applyFilters(this.rows);

    if (this.wantHead) {
      return { data: this.wantCount ? null : [], error: null, count: matched.length };
    }

    const finalRows = this.finalise(matched);

    if (this.singleMode === "single") {
      return { data: finalRows[0] ?? null, error: null, count: this.wantCount ? matched.length : null };
    }
    if (this.singleMode === "maybeSingle") {
      return { data: finalRows[0] ?? null, error: null, count: this.wantCount ? matched.length : null };
    }

    return { data: finalRows, error: null, count: this.wantCount ? matched.length : null };
  }

  private executeMutation(): QueryResult {
    const liveRows = mockTables[this.tableName] as unknown as Row[];
    const mutation = this.pendingMutation!;

    if (mutation.type === "insert") {
      const incoming = Array.isArray(mutation.values) ? mutation.values : [mutation.values!];
      const inserted = incoming.map((values) => {
        const row: Row = {
          id: `mock-${this.tableName}-${Math.random().toString(36).slice(2, 10)}`,
          created_at: new Date().toISOString(),
          ...values,
        };
        liveRows.push(row);
        return row;
      });
      this.rows = [...liveRows];
      const data = this.singleMode ? inserted[0] ?? null : inserted;
      return { data, error: null, count: null };
    }

    if (mutation.type === "update") {
      const matched = this.applyFilters(liveRows);
      for (const row of matched) Object.assign(row, mutation.values);
      this.rows = [...liveRows];
      const data = this.singleMode ? matched[0] ?? null : matched;
      return { data, error: null, count: null };
    }

    // delete
    const toDelete = new Set(this.applyFilters(liveRows));
    const remaining = liveRows.filter((row) => !toDelete.has(row));
    liveRows.length = 0;
    liveRows.push(...remaining);
    this.rows = [...liveRows];
    return { data: Array.from(toDelete), error: null, count: null };
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

interface MockChannel {
  on: (...args: unknown[]) => MockChannel;
  subscribe: (...args: unknown[]) => MockChannel;
  unsubscribe: () => MockChannel;
}

function createMockChannel(): MockChannel {
  const channel: MockChannel = {
    on: () => channel,
    subscribe: () => channel,
    unsubscribe: () => channel,
  };
  return channel;
}

const mockSession = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_in: 3600,
  token_type: "bearer",
  user: MOCK_USER,
};

function createMockAuth() {
  return {
    getUser: async () => ({ data: { user: MOCK_USER }, error: null }),
    getSession: async () => ({ data: { session: mockSession }, error: null }),
    signInWithPassword: async () => ({ data: { user: MOCK_USER, session: mockSession }, error: null }),
    signOut: async () => ({ error: null }),
    updateUser: async () => ({ data: { user: MOCK_USER }, error: null }),
    onAuthStateChange: (_callback: unknown) => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
  };
}

export interface MockSupabaseClient {
  from: (table: string) => MockQueryBuilder;
  auth: ReturnType<typeof createMockAuth>;
  channel: (name: string) => MockChannel;
  removeChannel: (channel: MockChannel) => void;
}

export function createMockClient(): MockSupabaseClient {
  return {
    from: (table: string) => new MockQueryBuilder(table as MockTableName),
    auth: createMockAuth(),
    channel: () => createMockChannel(),
    removeChannel: () => {},
  };
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
