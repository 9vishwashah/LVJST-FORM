import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <h1 className="text-4xl font-bold text-primary-900 mb-4">LVJST Pre-Survey</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-md">Welcome to the Labdhi Vikram Jan Seva Trust Pre-Survey Portal.</p>
            <div className="space-x-4">
                <Link to="/login" className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">Login</Link>
                <Link to="/signup" className="px-6 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition">Sign Up</Link>
            </div>
        </div>
    );
};

export default Home;
