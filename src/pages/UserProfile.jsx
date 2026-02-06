import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, Phone, MapPin, Calendar, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfileAndSurveys();
    }, []);

    const fetchProfileAndSurveys = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Fetch Profile
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileError) console.error('Error fetching profile:', profileError);
                setProfile(profileData);

                // Fetch Surveys
                const { data: surveyData, error: surveyError } = await supabase
                    .from('surveys')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (surveyError) console.error('Error fetching surveys:', surveyError);
                setSurveys(surveyData || []);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-primary-900">My Profile</h1>
                <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition">
                    <LogOut className="w-4 h-4" /> Logout
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mb-3">
                                <User className="w-10 h-10" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">{profile?.full_name || 'User'}</h2>
                            <p className="text-slate-500 text-sm">{profile?.email}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-slate-600">
                                <Phone className="w-5 h-5 text-primary-400" />
                                <span>{profile?.mobile || 'No mobile'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <MapPin className="w-5 h-5 text-primary-400" />
                                <span>{profile?.city}, {profile?.taluka}</span>
                            </div>
                            <div className="pt-4 border-t border-slate-100 text-sm text-slate-500">
                                <span className="font-medium">Address:</span> <br />
                                {profile?.address}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submissions List */}
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary-600" /> Survey Submissions
                    </h2>

                    {surveys.length === 0 ? (
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
                            <p className="text-slate-500 mb-4">You haven't submitted any surveys yet.</p>
                            <button onClick={() => navigate('/pre-survey')} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                                Start New Survey
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {surveys.map((survey) => (
                                <div key={survey.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg text-primary-900">{survey.derasar_name}</h3>
                                            <p className="text-slate-500">{survey.location_name}, {survey.district}</p>
                                        </div>
                                        <span className="text-xs font-medium bg-green-100 text-green-700 px-3 py-1 rounded-full">
                                            Submitted
                                        </span>
                                    </div>
                                    <div className="mt-4 flex gap-4 text-sm text-slate-600">
                                        <div>
                                            <span className="font-medium block text-slate-400 text-xs">Mulnayak</span>
                                            {survey.mulnayak_name}
                                        </div>
                                        <div>
                                            <span className="font-medium block text-slate-400 text-xs">Submission Date</span>
                                            {new Date(survey.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
