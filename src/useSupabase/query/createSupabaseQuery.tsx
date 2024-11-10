import { SupabaseClient } from '@supabase/supabase-js';
import { useQueries } from '@tanstack/react-query';
import { QueryBuilder } from './build';
import { DatabaseTemp, PublicSchemaKeys, SupabaseQueryConfig, TableName, Tables } from './types';

export const createSupabaseQuery = <D extends DatabaseTemp = any>(
  client: SupabaseClient<D>
) => {
  const useSupabaseQuery = ({
    table,
    column = '*',
    count,
    ...configObj
  }: SupabaseQueryConfig<D, PublicSchemaKeys<D>, Tables<D, PublicSchemaKeys<D>, TableName<D, PublicSchemaKeys<D>>>) => {
    const fetchData = async () => {
      const QueryBase = client.from(table).select(column, { count });

      const QueryFn = QueryBuilder<D>(configObj, QueryBase);

      const { data, error, count: rowCount } = await QueryFn;

      if (error) throw error;

      return {
        count: rowCount || 0,
        payload: data as T,
      };
    };

    useQueries({});
  };

  return {
    useSupabaseQuery,
  };
};
