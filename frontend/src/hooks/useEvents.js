import { useCallback, useEffect, useState } from "react";
import { getEvents } from "../api/events";

export function useEvents() {
  const [events, setEvents] = useState([]);

  const refetch = useCallback(() => {
    return getEvents().then((response) => {
      setEvents(response.data.events);
    });
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { events, refetch };
}
