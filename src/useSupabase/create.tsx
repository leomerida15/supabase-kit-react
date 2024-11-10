import { SupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';
import { createSupabaseQuery } from './query/createSupabaseQuery';
import { DatabaseTemp } from './query/types.query';

export const createSupabaseTools = <D extends DatabaseTemp = any>(client: SupabaseClient<D>) => {
    const useSupabase = () => useMemo(() => client, []);

    const SupabaseQuery = createSupabaseQuery(client);

    return {
        useSupabase,
        ...SupabaseQuery,
    };
};
