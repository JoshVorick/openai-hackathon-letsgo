import "server-only";

type CountPreference = "exact" | "planned" | "estimated";

type SupabaseError = {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
};

type SupabaseResponse<T> = {
  data: T | null;
  error: SupabaseError | null;
  count?: number | null;
};

type FilterOperator = "eq" | "gt" | "lt" | "gte" | "in";

type Filter = {
  column: string;
  operator: FilterOperator;
  value: unknown;
};

type Order = {
  column: string;
  ascending: boolean;
};

type QueryConfig = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  columns?: string;
  head: boolean;
  count?: CountPreference;
  filters: Filter[];
  orderings: Order[];
  limit?: number;
  body?: unknown;
  returnRepresentation: boolean;
  onConflict?: string;
  isUpsert: boolean;
};

type SelectOptions = {
  head?: boolean;
  count?: CountPreference;
};

function serializeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function parseCount(contentRange: string | null): number | null {
  if (!contentRange) {
    return null;
  }

  const [, total] = contentRange.split("/");

  if (!total) {
    return null;
  }

  const parsed = Number.parseInt(total, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

class SupabaseFilterBuilder<T = any> implements PromiseLike<SupabaseResponse<T>> {
  protected config: QueryConfig;

  constructor(
    protected client: SupabaseClient,
    protected table: string,
    config: Partial<QueryConfig>
  ) {
    this.config = {
      method: config.method ?? "GET",
      columns: config.columns,
      head: config.head ?? false,
      count: config.count,
      filters: config.filters ?? [],
      orderings: config.orderings ?? [],
      limit: config.limit,
      body: config.body,
      returnRepresentation: config.returnRepresentation ?? false,
      onConflict: config.onConflict,
      isUpsert: config.isUpsert ?? false,
    };
  }

  eq(column: string, value: unknown) {
    this.config.filters.push({ column, operator: "eq", value });
    return this;
  }

  gt(column: string, value: unknown) {
    this.config.filters.push({ column, operator: "gt", value });
    return this;
  }

  lt(column: string, value: unknown) {
    this.config.filters.push({ column, operator: "lt", value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.config.filters.push({ column, operator: "gte", value });
    return this;
  }

  in(column: string, values: readonly unknown[]) {
    this.config.filters.push({ column, operator: "in", value: values });
    return this;
  }

  order(column: string, { ascending }: { ascending: boolean }) {
    this.config.orderings.push({ column, ascending });
    return this;
  }

  limit(value: number) {
    this.config.limit = value;
    return this;
  }

  select(columns = "*") {
    this.config.columns = columns;
    this.config.returnRepresentation = true;
    return this;
  }

  async execute(): Promise<SupabaseResponse<T>> {
    return this.client.request<T>(this.table, this.config);
  }

  then<TResult1 = SupabaseResponse<T>, TResult2 = never>(
    onfulfilled?: ((value: SupabaseResponse<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

class SupabaseInsertBuilder<T = any> extends SupabaseFilterBuilder<T> {
  constructor(client: SupabaseClient, table: string, values: unknown) {
    super(client, table, {
      method: "POST",
      body: values,
      head: false,
      returnRepresentation: false,
    });
  }
}

class SupabaseUpdateBuilder<T = any> extends SupabaseFilterBuilder<T> {
  constructor(client: SupabaseClient, table: string, values: unknown) {
    super(client, table, {
      method: "PATCH",
      body: values,
      head: false,
      returnRepresentation: false,
    });
  }
}

class SupabaseDeleteBuilder<T = any> extends SupabaseFilterBuilder<T> {
  constructor(client: SupabaseClient, table: string) {
    super(client, table, {
      method: "DELETE",
      head: false,
      returnRepresentation: false,
    });
  }
}

class SupabaseUpsertBuilder<T = any> extends SupabaseInsertBuilder<T> {
  constructor(
    client: SupabaseClient,
    table: string,
    values: unknown,
    onConflict?: string
  ) {
    super(client, table, values);
    this.config.isUpsert = true;
    this.config.onConflict = onConflict;
  }
}

class SupabaseTable {
  constructor(private client: SupabaseClient, private table: string) {}

  select(columns = "*", options?: SelectOptions) {
    return new SupabaseFilterBuilder(this.client, this.table, {
      method: "GET",
      columns,
      head: options?.head ?? false,
      count: options?.count,
      returnRepresentation: !(options?.head ?? false),
    });
  }

  insert(values: unknown) {
    return new SupabaseInsertBuilder(this.client, this.table, values);
  }

  update(values: unknown) {
    return new SupabaseUpdateBuilder(this.client, this.table, values);
  }

  delete() {
    return new SupabaseDeleteBuilder(this.client, this.table);
  }

  upsert(values: unknown, options?: { onConflict?: string }) {
    return new SupabaseUpsertBuilder(
      this.client,
      this.table,
      values,
      options?.onConflict
    );
  }
}

class SupabaseClient {
  private restUrl: string;

  constructor(restUrl: string, private serviceRoleKey: string) {
    this.restUrl = restUrl.replace(/\/$/, "");
  }

  from(table: string) {
    return new SupabaseTable(this, table);
  }

  async request<T>(table: string, config: QueryConfig): Promise<SupabaseResponse<T>> {
    const url = new URL(`${this.restUrl}/rest/v1/${table}`);

    if (config.columns) {
      url.searchParams.set("select", config.columns);
    }

    for (const filter of config.filters) {
      if (filter.operator === "in") {
        const values = Array.isArray(filter.value) ? filter.value : [];
        const serialized = values.map(serializeValue).join(",");
        url.searchParams.append(filter.column, `in.(${serialized})`);
        continue;
      }

      url.searchParams.append(
        filter.column,
        `${filter.operator}.${serializeValue(filter.value)}`
      );
    }

    for (const order of config.orderings) {
      url.searchParams.append(
        "order",
        `${order.column}.${order.ascending ? "asc" : "desc"}`
      );
    }

    if (typeof config.limit === "number") {
      url.searchParams.set("limit", config.limit.toString());
    }

    if (config.onConflict) {
      url.searchParams.set("on_conflict", config.onConflict);
    }

    const headers: Record<string, string> = {
      apikey: this.serviceRoleKey,
      Authorization: `Bearer ${this.serviceRoleKey}`,
      Accept: "application/json",
    };

    const prefer: Set<string> = new Set();

    if (config.isUpsert) {
      prefer.add("resolution=merge-duplicates");
    }

    if (config.count) {
      prefer.add(`count=${config.count}`);
    }

    if (config.returnRepresentation) {
      prefer.add("return=representation");
    } else if (config.method !== "GET") {
      prefer.add("return=minimal");
    }

    if (config.head) {
      prefer.add("return=minimal");
      if (!config.count) {
        prefer.add("count=exact");
      }
      headers["Range"] = "0-0";
    }

    if (prefer.size > 0) {
      headers["Prefer"] = Array.from(prefer).join(", ");
    }

    if (config.method !== "GET") {
      headers["Content-Type"] = "application/json";
    }

    const requestInit: RequestInit = {
      method: config.head ? "GET" : config.method,
      headers,
    };

    if (config.body !== undefined && config.method !== "GET") {
      requestInit.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url.toString(), requestInit);
      const count = parseCount(response.headers.get("content-range"));

      if (!response.ok) {
        let details: any = null;

        try {
          details = await response.json();
        } catch {
          // No JSON payload in error response
        }

        return {
          data: null,
          error: {
            message: details?.message ?? response.statusText,
            details: details?.details,
            hint: details?.hint,
            code: details?.code ? String(details.code) : undefined,
          },
          count,
        };
      }

      if (config.head || response.status === 204) {
        return { data: null, error: null, count };
      }

      const text = await response.text();
      const data = text ? (JSON.parse(text) as T) : null;

      return { data, error: null, count };
    } catch (error) {
      return {
        data: null,
        error: {
          message:
            error instanceof Error ? error.message : "Unexpected Supabase error",
        },
        count: null,
      };
    }
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL is not defined");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined");
}

export const supabase = new SupabaseClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

export type { SupabaseResponse };
