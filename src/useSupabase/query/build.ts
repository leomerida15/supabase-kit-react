import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/supabase-js/dist/module/lib/types';
import { Where, WhereBasicKeys } from './types';
import { DatabaseTemp, SupabaseQueryConfig } from './types.query';

type ConfigObj<D extends DatabaseTemp> = Omit<SupabaseQueryConfig<D>, 'table' | 'column' | 'count'>;

export const QueryBuilder = <
    D extends DatabaseTemp,
    SchemaName extends string & keyof D = 'public' extends keyof D ? 'public' : string & keyof D,
    Schema extends GenericSchema = D[SchemaName] extends GenericSchema ? D[SchemaName] : any,
>(
    { where = {}, limit, single }: ConfigObj<D>,
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

    return Query;
};
