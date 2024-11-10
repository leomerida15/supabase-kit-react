import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/supabase-js/dist/module/lib/types';
import { SupabaseQueryConfig } from './types';

type ConfigObj = Omit<
  SupabaseQueryConfig<any, any>,
  'table' | 'column' | 'count'
>;

export const QueryBuilder = <
  D extends any,
  SchemaName extends string & keyof D = 'public' extends keyof D
    ? 'public'
    : string & keyof D,
  Schema extends GenericSchema = D[SchemaName] extends GenericSchema
    ? D[SchemaName]
    : any
>(
  { where = {}, limit, single }: ConfigObj,
  Query: PostgrestFilterBuilder<Schema, any, any>
) => {
  const where_keys = ['eq', 'neq', 'in', 'is', 'lt', 'lte', 'gt', 'gte'];

  for (const [k, vQ] of Object.entries(where)) {
    const isKey = where_keys.includes(k);
    if (isKey) {
      for (const [k, v] of Object.entries(vQ)) {
        Query = (Query as any)[k](k, v);
      }
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
