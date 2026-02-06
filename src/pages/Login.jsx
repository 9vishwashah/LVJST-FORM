import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            alert(error.message);
        } else {
            navigate('/pre-survey');
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white shadow-sm py-4">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-xl font-bold text-primary-900 font-serif tracking-wide">Labdhi Vikram Jan Seva Trust (LVJST)</h1>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-grow flex items-center justify-center py-10 px-4">
                <div className="card w-full max-w-md border-t-4 border-primary-600">
                    <div className="text-center mb-8">
                        {/* Logo Placeholder */}
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-50 text-primary-600 mb-4 shadow-inner">
                            <span className="font-serif text-3xl font-bold">LV</span>
                        </div>
                        <h2 className="text-2xl font-bold text-primary-800 font-serif">Pre-Survey Form</h2>
                        <div className="mt-3 text-sm text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <p className="font-medium">Jinalaya / Derasar Survey</p>
                            <p className="text-xs mt-1 text-slate-500">For preservation and protection of our heritage</p>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase">Password</label>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                        >
                            {loading ? 'Logging in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-slate-600 mb-2 text-sm">New to LVJST?</p>
                        <Link to="/signup" className="text-primary-700 font-bold hover:underline text-sm uppercase tracking-wide">
                            Create Account for Survey
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-primary-900 text-white py-6 text-center">
                <p className="text-sm opacity-80">&copy; {new Date().getFullYear()} Labdhi Vikram Jan Seva Trust.</p>
                <p className="text-xs opacity-60 mt-1">Preserving Heritage, Protecting Faith.</p>
            </footer>
        </div>
    );
};

export default Login;
