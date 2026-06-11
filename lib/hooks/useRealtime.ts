"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useRealtime(
  tables: string[],
  onUpdate: () => void
) {
  useEffect(() => {
    const supabase = createClient();
    const channels = tables.map((table) =>
      supabase
        .channel(`realtime-${table}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          () => onUpdate()
        )
        .subscribe()
    );

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [tables, onUpdate]);
}
