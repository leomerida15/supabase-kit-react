import {
    REALTIME_LISTEN_TYPES,
    REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
    SupabaseClient,
} from '@supabase/supabase-js';
import { DatabaseTemp } from '../query';

export interface SupaSubscriptionProps<
    D extends DatabaseTemp,
    T extends `${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT}` = '*',
    K extends keyof (D['public']['Tables'] & D['public']['Views']) = keyof (D['public']['Tables'] &
        D['public']['Views']) &
        Parameters<SupabaseClient<D>['from']>['0'],
    V = (D['public']['Tables'] & D['public']['Views'])[K] extends {
        Row: infer R;
    }
        ? R extends Array<any>
            ? keyof R[0]
            : keyof R
        : string,
> {
    table: K;
    schema?: string;
    type?: `${REALTIME_LISTEN_TYPES.POSTGRES_CHANGES}`;
    event?: T;
    channel?: string;
    where?: {
        key: V;
        operator: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'in';
        value: string | number | boolean | Array<string> | Array<number>;
    };
    callback?: Parameters<ReturnType<SupabaseClient<D>['channel']>['on']>[2];
}

export interface PayloadRealtime<
    D extends DatabaseTemp,
    K extends keyof (D['public']['Tables'] & D['public']['Views']) = keyof (D['public']['Tables'] &
        D['public']['Views']) &
        Parameters<SupabaseClient<D>['from']>['0'],
    V = (D['public']['Tables'] & D['public']['Views'])[K] extends {
        Row: infer R;
    }
        ? R extends Array<any>
            ? keyof R[0]
            : keyof R
        : string,
> {
    schema: string;
    table: string;
    commit_timestamp: string;
    eventType:
        | REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.DELETE
        | REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT
        | REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.UPDATE;
    new: Partial<V>;
    old: Old;
    errors: any;
}

export interface Old {
    id: number;
}
