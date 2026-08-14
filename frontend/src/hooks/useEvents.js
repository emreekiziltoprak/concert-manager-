import { useCallback, useEffect, useState } from "react";
import { getEvents } from "../api/events";

export function useEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    return getEvents().then((response) => {
      setEvents(response.data.events);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { events, loading, refetch };
}
