import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Plus, Trash2, Upload, MapPin } from 'lucide-react';

const PreSurveyForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        derasarName: '',
        locationName: '',
        fullAddress: '',
        state: '',
        district: '',
        taluka: '',
        gmappingLocation: '',
        pedhiManagerName: '',
        pedhiManagerMobile: '',
        poojariName: '',
        poojariMobile: '',
        mulnayakName: ''
    });

    const [trustees, setTrustees] = useState([{ name: '', mobile: '' }]);
    const [files, setFiles] = useState({ mulnayakPhoto: null, jinalayPhoto: null });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTrusteeChange = (index, field, value) => {
        const newTrustees = [...trustees];
        newTrustees[index][field] = value;
        setTrustees(newTrustees);
    };

    const addTrustee = () => {
        setTrustees([...trustees, { name: '', mobile: '' }]);
    };

    const removeTrustee = (index) => {
        if (trustees.length > 1) {
            const newTrustees = [...trustees];
            newTrustees.splice(index, 1);
            setTrustees(newTrustees);
        }
    };

    const handleFileChange = (e) => {
        setFiles({ ...files, [e.target.name]: e.target.files[0] });
    };

    const uploadFile = async (file, bucket) => {
        if (!file) return null;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

        if (error) {
            console.error(`Error uploading ${bucket}:`, error);
            return null;
        }

        const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Upload photos
            const mulnayakUrl = await uploadFile(files.mulnayakPhoto, 'mulnayak-photos');
            const jinalayUrl = await uploadFile(files.jinalayPhoto, 'jinalay-photos');

            // Insert Survey Data
            const { data: surveyData, error: surveyError } = await supabase
                .from('surveys')
                .insert({
                    user_id: user.id,
                    derasar_name: formData.derasarName,
                    location_name: formData.locationName,
                    full_address: formData.fullAddress,
                    state: formData.state,
                    district: formData.district,
                    taluka: formData.taluka,
                    gmapping_location: formData.gmappingLocation,
                    pedhi_manager_name: formData.pedhiManagerName,
                    pedhi_manager_mobile: formData.pedhiManagerMobile,
                    poojari_name: formData.poojariName,
                    poojari_mobile: formData.poojariMobile,
                    mulnayak_name: formData.mulnayakName,
                    mulnayak_photo_url: mulnayakUrl,
                    jinalay_photo_url: jinalayUrl
                })
                .select()
                .single();

            if (surveyError) throw surveyError;

            // Insert Trustees
            if (surveyData) {
                const trusteeInserts = trustees
                    .filter(t => t.name && t.mobile)
                    .map(t => ({
                        survey_id: surveyData.id,
                        name: t.name,
                        mobile: t.mobile
                    }));

                if (trusteeInserts.length > 0) {
                    const { error: trusteeError } = await supabase
                        .from('trustees')
                        .insert(trusteeInserts);

                    if (trusteeError) throw trusteeError;
                }
            }

            alert('Form Submitted Successfully!');
            navigate('/profile');

        } catch (error) {
            console.error('Submission Error:', error);
            alert('Error submitting form: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-2xl my-10 border border-slate-100">
            <h1 className="text-3xl font-bold text-center text-primary-800 mb-8">Pre-Survey Form</h1>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1: Location Details */}
                <div className="bg-slate-50/50 p-6 rounded-xl border border-primary-100">
                    <h2 className="text-xl font-bold text-primary-700 mb-4 flex items-center gap-2 font-serif">
                        <MapPin className="w-5 h-5" /> Location Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name of Derasar / Jinalay</label>
                            <input name="derasarName" onChange={handleInputChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Town / Location Name</label>
                            <input name="locationName" onChange={handleInputChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Google Mapping Location (Link)</label>
                            <input name="gmappingLocation" onChange={handleInputChange} className="input-field" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Address</label>
                            <textarea name="fullAddress" onChange={handleInputChange} rows="3" className="input-field" required></textarea>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">State</label>
                            <input name="state" onChange={handleInputChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">District</label>
                            <input name="district" onChange={handleInputChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Taluka</label>
                            <input name="taluka" onChange={handleInputChange} className="input-field" required />
                        </div>
                    </div>
                </div>

                {/* Section 2: Management Details */}
                <div className="bg-slate-50/50 p-6 rounded-xl border border-primary-100">
                    <h2 className="text-xl font-bold text-primary-700 mb-4 font-serif">Management Details</h2>

                    {/* Trustees */}
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Trustees</label>
                        {trustees.map((trustee, index) => (
                            <div key={index} className="flex gap-4 mb-3 items-start">
                                <div className="flex-1">
                                    <input placeholder="Name" value={trustee.name} onChange={(e) => handleTrusteeChange(index, 'name', e.target.value)} className="input-field" />
                                </div>
                                <div className="flex-1">
                                    <input placeholder="Mobile No" value={trustee.mobile} onChange={(e) => handleTrusteeChange(index, 'mobile', e.target.value)} className="input-field" />
                                </div>
                                {trustees.length > 1 && (
                                    <button type="button" onClick={() => removeTrustee(index)} className="p-2 text-red-500 hover:text-red-700">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={addTrustee} className="flex items-center gap-2 text-sm text-primary-600 font-bold hover:text-primary-800 mt-2 uppercase tracking-wide">
                            <Plus className="w-4 h-4" /> Add Trustee
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pedhi Manager Name</label>
                            <input name="pedhiManagerName" onChange={handleInputChange} className="input-field" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pedhi Manager Mobile</label>
                            <input name="pedhiManagerMobile" onChange={handleInputChange} className="input-field" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Poojari Name</label>
                            <input name="poojariName" onChange={handleInputChange} className="input-field" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Poojari Mobile</label>
                            <input name="poojariMobile" onChange={handleInputChange} className="input-field" />
                        </div>
                    </div>
                </div>

                {/* Section 3: Deity & Photos */}
                <div className="bg-slate-50/50 p-6 rounded-xl border border-primary-100">
                    <h2 className="text-xl font-bold text-primary-700 mb-4 font-serif">Deity & Photos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mulnayak Bhagwan Name</label>
                            <input name="mulnayakName" onChange={handleInputChange} className="input-field" />
                        </div>

                        <div className="border-2 border-dashed border-primary-200 rounded-xl p-6 text-center hover:border-primary-500 transition-colors bg-white">
                            <label className="cursor-pointer block">
                                <Upload className="w-10 h-10 text-primary-400 mx-auto mb-2" />
                                <span className="text-sm font-medium text-slate-700 text-center block">Upload Mulnayak Photo</span>
                                <input type="file" name="mulnayakPhoto" onChange={handleFileChange} className="hidden" accept="image/*" />
                                {files.mulnayakPhoto && <p className="text-xs text-green-600 mt-2 font-bold">{files.mulnayakPhoto.name}</p>}
                            </label>
                        </div>

                        <div className="border-2 border-dashed border-primary-200 rounded-xl p-6 text-center hover:border-primary-500 transition-colors bg-white">
                            <label className="cursor-pointer block">
                                <Upload className="w-10 h-10 text-primary-400 mx-auto mb-2" />
                                <span className="text-sm font-medium text-slate-700 text-center block">Upload Jinalay Photo</span>
                                <input type="file" name="jinalayPhoto" onChange={handleFileChange} className="hidden" accept="image/*" />
                                {files.jinalayPhoto && <p className="text-xs text-green-600 mt-2 font-bold">{files.jinalayPhoto.name}</p>}
                            </label>
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary py-4 text-lg"
                    >
                        {loading ? 'Submitting Form...' : 'Submit Survey Form'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PreSurveyForm;
