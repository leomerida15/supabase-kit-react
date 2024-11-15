# get start

> CLI by generate useUrls and Urls functions by SSR.

## install

```bash
  npm i @supabase-kit/react
```

```bash
  bun add @supabase-kit/react
```

```bash
  pnpm add @supabase-kit/react
```

```bash
  yarn add @supabase-kit/react
```

## create tools

```typescript
import { createSupabaseTools } from '@supabase-kit/react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = '';

const supabaseKey = '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const {
    // query parsser object to client
    QueryBuilder,
    // hooks
    useSupabase,
    useSupaQuery,
    useSupaSession,
    useSupaRealtime,
    useSupaSubscription,
    useSupaInfiniteQuery,
} = createSupabaseTools(supabase);
```

-   useSupabase

```typescript
'use client';
import React from 'react';
import { useUrls } from '@/useUrls.hook';

export const Example = () => {
    const urls = useUrls();

    return <div>{urls.panel.root}</div>;
};
```
