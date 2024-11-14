import {
    REALTIME_LISTEN_TYPES,
    REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
    SupabaseClient,
} from '@supabase/supabase-js';
import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { createSupabaseQuery, DatabaseTemp } from '../query';
import { PayloadRealtime, SupaSubscriptionProps } from './types';

export const createSupabaseSubscription = <D extends DatabaseTemp>(
    client: SupabaseClient<D>,
    useQuery: ReturnType<typeof createSupabaseQuery<D>>['useSupaQuery'],
) => {
    const useSupaSubscription = ({
        table,
        schema = 'public',
        event = '*',
        where,
        type = 'postgres_changes',
        channel = 'general',
        callback = (payload) => console.log(payload),
    }: SupaSubscriptionProps<D>) => {
        const filter = useMemo(() => {
            const base = `${where?.key}=${where?.operator}`;

            if (where?.operator === 'in') return `${base}.(${where?.value.toString()})`;

            return `${base}.${where?.value}`;
        }, [where]);

        useEffect(() => {
            const subscription = client
                .channel(channel)
                .on(
                    type,
                    {
                        event,
                        schema,
                        table,
                        filter,
                    },
                    callback,
                )
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        }, [filter, callback, event, schema, table, type, channel]);
    };

    const useSupaRealtime = ({
        table,
        where,
        channel = 'general',
    }: Omit<SupaSubscriptionProps<D>, 'callback' | 'type' | 'event'>) => {
        const queryClient = useQueryClient();

        const queryConfig = useMemo(() => (where ? { [where.key]: where.value } : {}), [where]);

        const QueryKey = [table, 'subscription'].join('_') as unknown as QueryKey;

        const query = useQuery({
            table,
            where: queryConfig,
            options: {
                queryKey: ['subscription'],
                staleTime: Infinity,
            },
        });

        const filter = useMemo(() => {
            const base = `${where?.key}=${where?.operator}`;

            if (where?.operator === 'in') return `${base}.(${where?.value.toString()})`;

            return `${base}.${where?.value}`;
        }, [where]);

        useEffect(() => {
            const subscription = client
                .channel(channel)
                .on(
                    REALTIME_LISTEN_TYPES.POSTGRES_CHANGES as 'system',
                    {
                        event: '*',
                        schema: 'public',
                        table,
                        filter,
                    },
                    (payload: PayloadRealtime<D, typeof table>) => {
                        const eventMatch = {
                            [REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.DELETE]: () => {
                                queryClient.setQueryData(QueryKey, (oldData: any) => ({
                                    ...oldData,
                                    data: oldData.data.filter((d: any) => d.id !== payload.old.id),
                                }));
                            },
                            [REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT]: () => {
                                queryClient.setQueryData(QueryKey, (oldData: any) => ({
                                    ...oldData,
                                    data: [...oldData.data, payload.new],
                                }));
                            },
                            [REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.UPDATE]: () => {
                                queryClient.setQueryData(QueryKey, (oldData: any) => ({
                                    ...oldData,
                                    data: oldData.data.map((d: any) => {
                                        if (d.id !== payload.old.id) return payload.new;

                                        return d;
                                    }),
                                }));
                            },
                        };

                        eventMatch[payload.eventType]();
                    },
                )
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        }, [queryClient, filter, channel, table, QueryKey]);

        return query;
    };

    return {
        useSupaSubscription,
        useSupaRealtime,
    };
};
