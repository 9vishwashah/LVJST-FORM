import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Signup = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        age: '',
        gender: '',
        city: '',
        taluka: '',
        address: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);

        // 1. Sign up auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
        });

        if (authError) {
            alert(authError.message);
            setLoading(false);
            return;
        }

        // 2. Insert into profiles (trigger might handle this, or manual insert)
        // For now, let's assume manual insert or we rely on a database trigger if configured.
        // Based on schema, we have a profiles table. Let's try to insert additional details.

        if (authData.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    full_name: formData.fullName,
                    email: formData.email,
                    mobile: formData.phone,
                    age: formData.age,
                    gender: formData.gender,
                    address: formData.address,
                    city: formData.city,
                    taluka: formData.taluka
                });

            if (profileError) {
                console.error('Profile update failed:', profileError);
                alert('Account created but profile setup failed. Please contact support or try again.\nError: ' + profileError.message);
                setLoading(false);
                return;
            }

            alert('Signup successful! Please login.');
            navigate('/login');
        }

        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen py-10 px-4">
            <div className="card w-full max-w-lg">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-primary-600 font-serif">Create Account</h2>
                    <p className="text-slate-500 mt-2">Join to submit your pre-survey form</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                            <input name="fullName" placeholder="Enter full name" onChange={handleChange} className="input-field" required />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                            <input name="email" type="email" placeholder="name@example.com" onChange={handleChange} className="input-field" required />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile</label>
                            <input name="phone" placeholder="9876543210" onChange={handleChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Age</label>
                            <input name="age" type="number" placeholder="Age" onChange={handleChange} className="input-field" required />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gender</label>
                            <select name="gender" onChange={handleChange} className="input-field" required>
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">City</label>
                            <input name="city" placeholder="City" onChange={handleChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Taluka</label>
                            <input name="taluka" placeholder="Taluka" onChange={handleChange} className="input-field" required />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                            <textarea name="address" placeholder="Full residential address" onChange={handleChange} className="input-field min-h-[80px]" required />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                            <input name="password" type="password" placeholder="Create a strong password" onChange={handleChange} className="input-field" required />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary mt-6"
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-slate-600">Already have an account? <Link to="/login" className="text-primary-600 font-bold hover:underline">Log in</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
