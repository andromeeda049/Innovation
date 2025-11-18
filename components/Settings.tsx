import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { SunIcon, MoonIcon } from './icons';

const Settings: React.FC = () => {
    const { scriptUrl, setScriptUrl, isDataSynced, theme, setTheme } = useContext(AppContext);
    const [currentUrl, setCurrentUrl] = useState(scriptUrl);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setCurrentUrl(scriptUrl);
    }, [scriptUrl]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setScriptUrl(currentUrl);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="space-y-8">
             <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">ลักษณะที่ปรากฏ</h2>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => setTheme('light')}
                        className={`flex flex-col items-center justify-center w-32 h-24 p-4 rounded-lg border-2 transition-colors duration-200 ${
                            theme === 'light' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/50' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-teal-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                        aria-pressed={theme === 'light'}
                    >
                        <SunIcon className="w-8 h-8 text-yellow-500 mb-2" />
                        <span className="font-semibold text-gray-800 dark:text-white">สว่าง</span>
                    </button>
                    <button
                        onClick={() => setTheme('dark')}
                        className={`flex flex-col items-center justify-center w-32 h-24 p-4 rounded-lg border-2 transition-colors duration-200 ${
                            theme === 'dark' ? 'border-teal-500 bg-slate-800' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-teal-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                         aria-pressed={theme === 'dark'}
                    >
                        <MoonIcon className="w-8 h-8 text-indigo-400 mb-2" />
                        <span className="font-semibold text-gray-800 dark:text-white">มืด</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 text-center">ตั้งค่าการเชื่อมต่อ Google Sheets</h2>
                <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                    เชื่อมต่อแอปพลิเคชันกับ Google Sheets เพื่อบันทึกและซิงค์ข้อมูลส่วนตัวของคุณ
                </p>

                {saved && (
                    <div className="bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500 text-green-700 dark:text-green-300 p-4 rounded-md mb-6" role="alert">
                        <p className="font-bold">บันทึก URL สำเร็จ!</p>
                        <p>แอปจะพยายามดึงข้อมูลล่าสุดเมื่อคุณเปิดแอปครั้งถัดไป</p>
                    </div>
                )}
                
                 <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
                    <span className={`w-3 h-3 rounded-full ${isDataSynced ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></span>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        สถานะ: {isDataSynced ? 'ข้อมูลเป็นปัจจุบัน' : 'กำลังซิงค์ข้อมูล...'}
                    </p>
                </div>


                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label htmlFor="scriptUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Web App URL จาก Google Apps Script
                        </label>
                        <input
                            type="url"
                            id="scriptUrl"
                            value={currentUrl}
                            onChange={(e) => setCurrentUrl(e.target.value)}
                            placeholder="https://script.google.com/macros/s/.../exec"
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-teal-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-300 dark:focus:ring-teal-700 transition-colors duration-300"
                    >
                        บันทึกการเชื่อมต่อ
                    </button>
                </form>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">วิธีการตั้งค่า</h3>
                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                    <ol className="list-decimal pl-5 space-y-4">
                        <li>
                            <strong>สร้าง Google Sheet:</strong> ไปที่ <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-400 font-semibold">sheets.new</a> และตั้งชื่อคอลัมน์ในแถวแรก (A1-H1) ดังนี้: 
                            <code className="block bg-gray-100 dark:bg-gray-700 p-2 rounded-md mt-1 text-xs">timestamp, gender, age, weight, height, waist, hip, activityLevel</code>
                        </li>
                        <li>
                            <strong>เปิด Apps Script:</strong> ใน Google Sheet, ไปที่เมนู `ส่วนขยาย` &gt; `Apps Script`
                        </li>
                        <li>
                            <strong>เพิ่มโค้ด:</strong> ลบโค้ดที่มีอยู่และคัดลอกโค้ดจาก `README.md` ของโปรเจกต์นี้ไปวางแทนที่ จากนั้นกดบันทึก (💾)
                        </li>
                        <li>
                            <strong>Deploy สคริปต์:</strong>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>คลิกปุ่มสีน้ำเงิน `ทำให้ใช้งานได้` &gt; `การทำให้ใช้งานได้รายการใหม่`</li>
                                <li>คลิกไอคอนฟันเฟือง (⚙️) และเลือกประเภทเป็น `เว็บแอป`</li>
                                <li>ตั้งค่า "ผู้ที่เข้าถึงได้" เป็น **`ทุกคน (Anyone)`** (สำคัญมาก!)</li>
                                <li>กด `ทำให้ใช้งานได้` และให้สิทธิ์การเข้าถึง (Authorize access) ตามขั้นตอน</li>
                            </ul>
                        </li>
                         <li>
                            <strong>ใช้งาน URL:</strong> คัดลอก `URL ของเว็บแอป` ที่ได้รับมา และนำมาวางในช่องด้านบน แล้วกดบันทึก
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default Settings;