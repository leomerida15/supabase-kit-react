import { FC, ReactNode } from 'react';

export type FCC<P = object> = FC<P & { children?: ReactNode }>;
