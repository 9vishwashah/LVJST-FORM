import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session && adminOnly) {
                checkAdmin(session.user.id);
            } else {
                setLoading(false);
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session && adminOnly) {
                checkAdmin(session.user.id);
            } else {
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [adminOnly]);

    const checkAdmin = async (userId) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', userId)
            .single();

        if (data && data.is_admin) {
            setIsAdmin(true);
        }
        setLoading(false);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && !isAdmin) {
        return <div className="p-4 text-center">Access Denied. Admins only.</div>;
    }

    return children;
};

export default ProtectedRoute;
