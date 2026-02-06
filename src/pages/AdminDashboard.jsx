import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, MapPin, User, FileText, Download } from 'lucide-react';

const AdminDashboard = () => {
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAllSurveys();
    }, []);

    const fetchAllSurveys = async () => {
        try {
            const { data, error } = await supabase
                .from('surveys')
                .select(`
                    *,
                    profiles:user_id (full_name, mobile)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSurveys(data || []);
        } catch (error) {
            console.error('Error fetching surveys:', error);
            alert('Error loading data');
        } finally {
            setLoading(false);
        }
    };

    const filteredSurveys = surveys.filter(survey =>
        survey.derasar_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        survey.location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        survey.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exportToCSV = () => {
        // Simple CSV export logic
        const headers = ['Derasar Name', 'Location', 'District', 'Submitted By', 'Mobile', 'Date'];
        const rows = filteredSurveys.map(s => [
            s.derasar_name,
            s.location_name,
            s.district,
            s.profiles?.full_name,
            s.profiles?.mobile,
            new Date(s.created_at).toLocaleDateString()
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "lvjst_surveys.csv");
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-900">Admin Dashboard</h1>
                    <p className="text-slate-500">Manage and view all pre-survey submissions</p>
                </div>
                <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Surveys</p>
                            <p className="text-2xl font-bold text-slate-800">{surveys.length}</p>
                        </div>
                    </div>
                </div>
                {/* Add more stats as needed */}
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search by Derasar, Location, or Submitter..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Derasar details</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Location</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Submitted By</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Date</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">Loading data...</td>
                                </tr>
                            ) : filteredSurveys.length > 0 ? (
                                filteredSurveys.map((survey) => (
                                    <tr key={survey.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{survey.derasar_name}</div>
                                            <div className="text-sm text-slate-500">{survey.mulnayak_name || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3 text-slate-400" />
                                                {survey.location_name}
                                            </div>
                                            <div className="pl-4 text-xs">{survey.district}, {survey.state}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-900">{survey.profiles?.full_name || 'Unknown'}</div>
                                            <div className="text-xs text-slate-500">{survey.profiles?.mobile}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(survey.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="text-primary-600 hover:text-primary-800 text-sm font-medium">View Details</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">No surveys found matching your search.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
