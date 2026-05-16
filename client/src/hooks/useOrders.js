import { useState, useEffect } from 'react';
import { getMyOrders } from '../services/orders.service';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMyOrders()
      .then((data) => { if (!cancelled) setOrders(Array.isArray(data) ? data : []); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { orders, loading, error };
};
