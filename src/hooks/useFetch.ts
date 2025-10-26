import { useState, useEffect } from 'react';

const useFetch = (url: string) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(url);
                const json = await response.json();
                setData(json);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [url]);

    return { data, loading, error };
};

export default useFetch;

// Usage Example:
// const { data, loading, error } = useFetch('/api/users');
// if (loading) return <Spinner />;
// if (error) return <Error message={error} />;
// return <UserList users={data} />;