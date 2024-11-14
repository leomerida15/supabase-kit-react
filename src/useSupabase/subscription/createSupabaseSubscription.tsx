import { REALTIME_POSTGRES_CHANGES_LISTEN_EVENT, SupabaseClient } from '@supabase/supabase-js';
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
            if (!where) return '';
            const base = `${where?.key}=${where?.operator}`;

            if (where?.operator === 'in') return `${base}.(${where?.value.toString()})`;

            return `${base}.${where?.value}`;
        }, [where]);

        const configQuery = useMemo(() => {
            if (!filter)
                return {
                    event,
                    schema,
                    table,
                };

            return {
                event,
                schema,
                table,
                filter,
            };
        }, [event, schema, table, filter]);

        useEffect(() => {
            const subscription = client
                .channel(channel)
                .on(type, configQuery, callback)
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        }, [callback, configQuery, type, channel]);
    };

    const useSupaRealtime = ({
        table,
        where,
        channel = 'general',
    }: Omit<SupaSubscriptionProps<D>, 'callback' | 'type' | 'event'>) => {
        const queryClient = useQueryClient();

        const queryConfig = useMemo(
            () => (where ? { [where.operator]: { [where.key]: where.value } } : {}),
            [where],
        );

        const QueryKey = [
            [table, 'subscription'].join('_'),
            queryConfig,
            null, // limit
            null, // single
            'estimated', // count
        ] as unknown as QueryKey;

        const query = useQuery({
            table,
            where: queryConfig,
            options: {
                queryKey: ['subscription'],
            },
            count: 'estimated',
        });

        useSupaSubscription({
            table,
            schema: 'public',
            event: '*',
            where,
            type: 'postgres_changes',
            channel,
            callback: (payload: PayloadRealtime<D, typeof table>) => {
                const eventMatch = {
                    [REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.DELETE]: () => {
                        queryClient.setQueryData(QueryKey, (oldData: any) => {
                            const payload = oldData.payload.filter(
                                (d: any) => d.id !== payload.old.id,
                            );

                            const count = payload.length;

                            return {
                                count,
                                payload,
                            };
                        });
                    },
                    [REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT]: () => {
                        queryClient.setQueryData(QueryKey, (oldData: any) => {
                            const newPayload = [...oldData.payload, payload.new];

                            const count = newPayload.length;

                            return {
                                count,
                                payload: newPayload,
                            };
                        });
                    },
                    [REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.UPDATE]: () => {
                        queryClient.setQueryData(QueryKey, (oldData: any) => {
                            const payload = oldData.payload.map((d: any) => {
                                if (d.id === payload.old.id) return payload.new;

                                return d;
                            });

                            const count = payload.length;

                            return {
                                count,
                                payload,
                            };
                        });
                    },
                };

                eventMatch[payload.eventType]();
            },
        });

        return query;
    };

    return {
        useSupaSubscription,
        useSupaRealtime,
    };
};
