import React, { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { User } from '../types';

const emojis = ['😊', '😎', '🎉', '🚀', '🌟', '💡', '🌱', '🍎', '💪', '🧠', '👍', '✨'];
const getRandomEmoji = () => emojis[Math.floor(Math.random() * emojis.length)];

const Auth: React.FC = () => {
    const { login } = useContext(AppContext);
    const [displayName, setDisplayName] = useState('');
    const [profilePicture, setProfilePicture] = useState(getRandomEmoji());
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleRandomizeEmoji = () => {
        setProfilePicture(getRandomEmoji());
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setProfilePicture(reader.result);
                }
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

        const newUser: User = {
            username: `user_${Date.now()}`,
            displayName: displayName.trim(),
            profilePicture: profilePicture,
        };
        login(newUser);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-sky-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 p-4">
            <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl text-center animate-fade-in-down">
                <h1 className="text-3xl font-bold text-teal-600 dark:text-teal-400">ยินดีต้อนรับ!</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2 mb-8">สร้างโปรไฟล์เพื่อเริ่มต้นใช้งาน</p>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                           <button type="button" onClick={handleRandomizeEmoji} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">สุ่ม Emoji ใหม่</button>
                           <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">อัปโหลดรูปภาพ</button>
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
            </div>
        </div>
    );
};

export default Auth;