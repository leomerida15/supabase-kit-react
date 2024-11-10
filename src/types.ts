import { FC, ReactNode } from "react";

export type FCC<P = {}> = FC<P & { children?: ReactNode }>