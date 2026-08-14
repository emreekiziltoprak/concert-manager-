import { useCallback, useEffect, useState } from "react";
import { getCategories } from "../api/categories";

export function useCategories() {
  const [categories, setCategories] = useState([]);

  const refetch = useCallback(() => {
    return getCategories()
      .then((response) => {
        setCategories(response.data.categories || response.data);
      })
      .catch((error) => console.error("Kategoriler yüklenemedi:", error));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { categories, setCategories, refetch };
}
