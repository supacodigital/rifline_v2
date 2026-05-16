import { useState, useEffect } from 'react';
import { getProducts } from '../services/products.service';

export const useProducts = ({ page = 1, limit = 24, category, search, sort, minPrice, maxPrice, inStock } = {}) => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getProducts({ page, limit, category, search, sort, minPrice, maxPrice, inStock })
      .then((res) => {
        if (!cancelled) {
          setData(res.data || []);
          setPagination(res.pagination || null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, limit, category, search, sort, minPrice, maxPrice, inStock]);

  return { data, pagination, loading, error };
};
