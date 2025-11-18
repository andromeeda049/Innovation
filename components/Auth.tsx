import React, { useState, useContext, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { User } from '../types';

const emojis = ['😊', '😎', '🎉', '🚀', '🌟', '💡', '🌱', '🍎', '💪', '🧠', '👍', '✨'];
const getRandomEmoji = () => emojis[Math.floor(Math.random() * emojis.length)];

const GuestLogin: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (displayName.trim().length < 2) {
            setError('ชื่อต้องมีความยาวอย่างน้อย 2 ตัวอักษร');
            return;
        }
        setError('');
        onLogin({
            username: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            displayName: displayName.trim(),
            profilePicture: '👤',
            role: 'guest',
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
             <div className="w-28 h-28 mx-auto rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 border-4 border-gray-200 dark:border-gray-700 shadow-md">
                <span className="text-6xl">👤</span>
            </div>
            <div>
                <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                   กรอกชื่อเพื่อทดลองใช้งาน
                </label>
                <input
                    type="text"
                    id="guestName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="เช่น ผู้เยี่ยมชม"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    required
                />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
                type="submit"
                className="w-full bg-gray-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-800 transition-all duration-300 transform hover:scale-105"
            >
                เข้าสู่ระบบในฐานะ Guest
            </button>
        </form>
    );
};


const UserLogin: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
    const [displayName, setDisplayName] = useState('');
    const [profilePicture, setProfilePicture] = useState(getRandomEmoji());
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleRandomizeEmoji = () => setProfilePicture(getRandomEmoji());

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') setProfilePicture(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const isBase64Image = profilePicture.startsWith('data:image/');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (displayName.trim().length < 2) {
            setError('ชื่อต้องมีความยาวอย่างน้อย 2 ตัวอักษร');
            return;
        }
        setError('');
        onLogin({
            username: `user_${Date.now()}`,
            displayName: displayName.trim(),
            profilePicture: profilePicture,
            role: 'user',
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    {isBase64Image ? (
                        <img src={profilePicture} alt="Profile preview" className="w-28 h-28 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700 shadow-md"/>
                    ) : (
                        <div className="w-28 h-28 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 border-4 border-gray-200 dark:border-gray-700 shadow-md">
                            <span className="text-6xl">{profilePicture}</span>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                   <button type="button" onClick={handleRandomizeEmoji} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">สุ่ม Emoji</button>
                   <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">อัปโหลด</button>
                   <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                </div>
            </div>

            <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                   ตั้งชื่อของคุณ
                </label>
                <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="เช่น สมชาย สุขภาพดี"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    required
                />
            </div>
            
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
                type="submit"
                className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-300 dark:focus:ring-teal-800 transition-all duration-300 transform hover:scale-105"
            >
                สร้างโปรไฟล์และเริ่มต้นใช้งาน
            </button>
        </form>
    );
};

const AdminLogin: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
    const [adminKey, setAdminKey] = useState('');
    const [error, setError] = useState('');
    // For simplicity, we'll use a hardcoded key. In a real app, this would be a proper auth flow.
    const SUPER_ADMIN_KEY = "SUPER_SECRET_ADMIN_KEY_HERE";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (adminKey === SUPER_ADMIN_KEY) {
            setError('');
            onLogin({
                username: `admin_${Date.now()}`,
                displayName: 'ผู้ดูแลระบบ',
                profilePicture: '👑',
                role: 'admin',
            });
        } else {
            setError('Admin Key ไม่ถูกต้อง');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            <div className="w-28 h-28 mx-auto rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/50 border-4 border-red-200 dark:border-red-800 shadow-md">
                <span className="text-6xl">🔑</span>
            </div>
            <div>
                <label htmlFor="adminKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                   Admin Key
                </label>
                <input
                    type="password"
                    id="adminKey"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="กรอกรหัสสำหรับผู้ดูแลระบบ"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    required
                />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
                type="submit"
                className="w-full bg-red-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800 transition-all duration-300 transform hover:scale-105"
            >
                เข้าสู่ระบบในฐานะ Admin
            </button>
        </form>
    );
};


const Auth: React.FC = () => {
    const { login } = useContext(AppContext);
    const [mode, setMode] = useState<'guest' | 'user' | 'admin'>('guest');
    
    const getWelcomeMessage = () => {
        switch(mode) {
            case 'guest': return 'เข้าสู่ระบบเพื่อทดลองใช้งาน';
            case 'user': return 'สร้างโปรไฟล์เพื่อบันทึกข้อมูล';
            case 'admin': return 'ลงชื่อเข้าใช้สำหรับผู้ดูแลระบบ';
            default: return 'เลือกวิธีการเข้าสู่ระบบ';
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-sky-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 p-4">
            <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl animate-fade-in-down">
                <h1 className="text-3xl font-bold text-teal-600 dark:text-teal-400 text-center">ยินดีต้อนรับ!</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2 mb-6 text-center">
                   {getWelcomeMessage()}
                </p>

                <div className="flex justify-center border-b dark:border-gray-700 mb-6">
                    <button onClick={() => setMode('guest')} className={`px-4 sm:px-6 py-2 font-semibold text-sm sm:text-base ${mode === 'guest' ? 'border-b-2 border-gray-500 text-gray-700 dark:text-gray-200' : 'text-gray-500'}`}>ผู้เยี่ยมชม</button>
                    <button onClick={() => setMode('user')} className={`px-4 sm:px-6 py-2 font-semibold text-sm sm:text-base ${mode === 'user' ? 'border-b-2 border-teal-500 text-teal-600 dark:text-teal-400' : 'text-gray-500'}`}>ผู้ใช้งาน</button>
                    <button onClick={() => setMode('admin')} className={`px-4 sm:px-6 py-2 font-semibold text-sm sm:text-base ${mode === 'admin' ? 'border-b-2 border-red-500 text-red-600 dark:text-red-400' : 'text-gray-500'}`}>ผู้ดูแลระบบ</button>
                </div>
                
                {mode === 'guest' && <GuestLogin onLogin={login} />}
                {mode === 'user' && <UserLogin onLogin={login} />}
                {mode === 'admin' && <AdminLogin onLogin={login} />}
            </div>
        </div>
    );
};

export default Auth;
