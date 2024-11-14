import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/supabase-js/dist/module/lib/types';
import { DatabaseTemp, Where, WhereBasicKeys } from './types';
import { SupabaseQueryConfig } from './types.query';

type ConfigObj<D extends DatabaseTemp> = Omit<SupabaseQueryConfig<D>, 'table' | 'column' | 'count'>;

export const QueryBuilder = <
    D extends DatabaseTemp,
    SchemaName extends string & keyof D = 'public' extends keyof D ? 'public' : string & keyof D,
    Schema extends GenericSchema = D[SchemaName] extends GenericSchema ? D[SchemaName] : any,
>(
    {
        where = {},
        limit,
        single,
        maybeSingle,
        csv,

        explain,

        order,
        range,
    }: ConfigObj<D>,
    Query: PostgrestFilterBuilder<Schema, any, any>,
) => {
    const where_keys: WhereBasicKeys[] = ['eq', 'neq', 'in', 'is', 'lt', 'lte', 'gt', 'gte'];

    for (const [kp, vQ] of Object.entries(where)) {
        const k = kp as WhereBasicKeys;

        const isKey = where_keys.includes(k);
        if (isKey)
            for (const [K, v] of Object.entries(vQ as Pick<Where<any>, WhereBasicKeys>)) {
                Query = (Query as any)[k](K, v);
            }
    }

    if (where.match) Query = Query.match(where.match as any);

    if (where.or) for (const or of where.or) Query = Query.or(or);

    if (where.filter)
        for (const [k, v] of Object.entries<[any, any]>(where.filter)) {
            Query.filter(k, ...v);
        }

    if (limit) Query = Query.limit(limit);

    if (single) Query = Query.single() as typeof Query;

    if (maybeSingle) Query = Query.maybeSingle() as typeof Query;

    if (csv) Query = Query.csv() as typeof Query;

    if (explain) Query = Query.explain(explain) as typeof Query;

    if (order)
        for (const [k, v] of Object.entries<{
            ascending?: boolean;
            nullsFirst?: boolean;
            foreignTable?: string;
            referencedTable?: string;
        }>(order as Record<string, any>))
            Query = Query.order(k, v);

    if (range) Query = Query.range(range.from, range.to, range.options);

    return Query;
};
