import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import { Camera, Trash2, Save, User, ShieldAlert, Monitor, Key, Clock, Settings, Bell, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { getRoleColor } from '../../utils/colorUtils'; // We'll create this to map roles to specific accents

const ProfilePage = () => {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    timezone: 'UTC',
    themePreference: 'system',
    notificationPreference: { email: true, push: false }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        timezone: user.timezone || 'UTC',
        themePreference: user.themePreference || 'system',
        notificationPreference: user.notificationPreference || { email: true, push: false }
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/profile/update', formData);
      await refreshProfile();
      toast.success("Profile settings updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Avatar image must be less than 5MB");
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await refreshProfile();
      toast.success("Avatar updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await api.delete('/profile/avatar');
      await refreshProfile();
      toast.success("Avatar removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove avatar");
    }
  };

  // UI Helpers
  const roleDisplay = user?.role?.replace('_', ' ') || 'AGENT';
  const roleColor = getRoleColor(user?.role);

  return (
    <div className="max-w-[1200px] mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-[800] text-neutral-primary tracking-tight italic">GLOBAL IDENTITY</h1>
        <p className="text-neutral-secondary font-[500] text-[14px] mt-1">Manage your platform-wide operator profile, preferences, and secure credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Avatar & System */}
        <div className="space-y-6">
          <div className="crm-card flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br" style={{ backgroundImage: `linear-gradient(135deg, ${roleColor.from}, ${roleColor.to})` }}></div>
            
            <div className="relative mt-8 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {user?.profileImage ? (
                <img src={user.profileImage} alt="Avatar" className="w-[100px] h-[100px] rounded-[24px] object-cover border-4 border-white shadow-md relative z-10" />
              ) : (
                <div className="w-[100px] h-[100px] rounded-[24px] border-4 border-white shadow-md flex items-center justify-center text-[36px] font-[800] text-white relative z-10" style={{ background: `linear-gradient(135deg, ${roleColor.from}, ${roleColor.to})` }}>
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 rounded-[24px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-[2px] border-4 border-white">
                {uploading ? (
                  <span className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                ) : (
                  <Camera size={24} className="text-white" />
                )}
              </div>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/jpeg,image/png,image/webp" className="hidden" />

            <div className="mt-4 w-full">
              <h2 className="text-[18px] font-[700] text-neutral-primary">{user?.name}</h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mt-2 border" style={{ borderColor: `${roleColor.from}40`, backgroundColor: `${roleColor.from}10`, color: roleColor.text }}>
                <ShieldAlert size={12} />
                <span className="text-[11px] font-[700] uppercase tracking-wide">{roleDisplay}</span>
              </div>
            </div>

            {user?.profileImage && (
              <button onClick={handleRemoveAvatar} className="mt-5 text-[12px] font-[600] text-neutral-muted hover:text-status-danger transition-colors flex items-center justify-center gap-1 w-full">
                <Trash2 size={14} /> Remove Photo
              </button>
            )}
          </div>

          <div className="crm-card">
             <div className="flex items-center gap-2 mb-4">
               <Monitor size={16} className="text-neutral-muted" />
               <h3 className="text-[13px] font-[700] text-neutral-primary uppercase tracking-wide">System Access</h3>
             </div>
             <div className="space-y-4">
               <div>
                 <span className="block text-[11px] font-[600] text-neutral-muted uppercase tracking-wider mb-1">Organization ID</span>
                 <span className="block text-[13px] font-[500] text-neutral-primary">{user?.organization?.name || 'Not Bound'}</span>
               </div>
               <div className="h-[1px] bg-neutral-border-default/50"></div>
               <div>
                 <span className="block text-[11px] font-[600] text-neutral-muted uppercase tracking-wider mb-1">Account Created</span>
                 <span className="block text-[13px] font-[500] text-neutral-primary">{new Date(user?.createdAt).toLocaleDateString()}</span>
               </div>
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Settings & Identity */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="crm-card">
            <h3 className="text-[16px] font-[700] text-neutral-primary mb-6 flex items-center gap-2">
              <User size={18} className="text-brand-accent" /> Operator Identity
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[12px] font-[600] text-neutral-secondary mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange}
                  className="w-full bg-neutral-page border border-neutral-border-default rounded-xl px-4 py-2.5 text-[14px] font-[500] text-neutral-primary focus:border-brand-focus focus:ring-1 focus:ring-brand-focus outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[12px] font-[600] text-neutral-secondary mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={user?.email || ''} 
                  disabled
                  className="w-full bg-neutral-hover border border-neutral-border-default rounded-xl px-4 py-2.5 text-[14px] font-[500] text-neutral-muted cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[12px] font-[600] text-neutral-secondary mb-1.5">Phone Number</label>
                <input 
                  type="text" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-neutral-page border border-neutral-border-default rounded-xl px-4 py-2.5 text-[14px] font-[500] text-neutral-primary focus:border-brand-focus focus:ring-1 focus:ring-brand-focus outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[12px] font-[600] text-neutral-secondary mb-1.5">Employee / Agent ID</label>
                <input 
                  type="text" 
                  value={`UID-${user?.id?.toString().padStart(6, '0')}`} 
                  disabled
                  className="w-full bg-neutral-hover border border-neutral-border-default rounded-xl px-4 py-2.5 text-[14px] font-[500] text-neutral-muted cursor-not-allowed font-mono"
                />
              </div>
            </div>
          </div>

          <div className="crm-card">
            <h3 className="text-[16px] font-[700] text-neutral-primary mb-6 flex items-center gap-2">
              <Settings size={18} className="text-brand-accent" /> Platform Preferences
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[12px] font-[600] text-neutral-secondary mb-1.5">Timezone</label>
                <select 
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  className="w-full bg-neutral-page border border-neutral-border-default rounded-xl px-4 py-2.5 text-[14px] font-[500] text-neutral-primary focus:border-brand-focus focus:ring-1 focus:ring-brand-focus outline-none transition-all"
                >
                  <option value="UTC">UTC (Universal Coordinated Time)</option>
                  <option value="America/New_York">Eastern Time (US & Canada)</option>
                  <option value="America/Chicago">Central Time (US & Canada)</option>
                  <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                  <option value="Asia/Kolkata">India Standard Time (IST)</option>
                  <option value="Europe/London">London (GMT/BST)</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-[600] text-neutral-secondary mb-1.5">Interface Theme</label>
                <select 
                  name="themePreference"
                  value={formData.themePreference}
                  onChange={handleInputChange}
                  className="w-full bg-neutral-page border border-neutral-border-default rounded-xl px-4 py-2.5 text-[14px] font-[500] text-neutral-primary focus:border-brand-focus focus:ring-1 focus:ring-brand-focus outline-none transition-all"
                >
                  <option value="system">System Default</option>
                  <option value="light">Always Light</option>
                  <option value="dark">Always Dark (Midnight)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button className="crm-btn-secondary px-6">Discard Changes</button>
            <button onClick={handleSave} disabled={loading} className="crm-btn-primary px-8 flex items-center gap-2">
              {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-white/50 border-t-white animate-spin"></span>
              ) : (
                <Save size={16} />
              )}
              {loading ? 'Saving...' : 'Save Profile Settings'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
