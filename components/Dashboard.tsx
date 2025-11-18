import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { AppView } from '../types';
import { ScaleIcon, FireIcon, CameraIcon, ShareIcon } from './icons';

const getBmiCategory = (bmi: number): { category: string; color: string } => {
    if (bmi < 18.5) return { category: 'น้ำหนักน้อยกว่าเกณฑ์', color: 'text-blue-500' };
    if (bmi < 23) return { category: 'สมส่วน', color: 'text-green-500' };
    if (bmi < 25) return { category: 'น้ำหนักเกิน', color: 'text-yellow-500' };
    if (bmi < 30) return { category: 'โรคอ้วนระดับที่ 1', color: 'text-orange-500' };
    return { category: 'โรคอ้วนระดับที่ 2', color: 'text-red-500' };
};

const Dashboard: React.FC = () => {
  const { setActiveView, bmiHistory, tdeeHistory, latestFoodAnalysis } = useContext(AppContext);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const latestBmi = bmiHistory[0];
  const latestTdee = tdeeHistory[0];

  const bmiInfo = latestBmi ? getBmiCategory(latestBmi.value) : null;

  const handleShareSummary = async () => {
    let shareText = "ภาพรวมสุขภาพของฉัน:\n\n";

    if (latestBmi && bmiInfo) {
        shareText += `📊 BMI: ${latestBmi.value.toFixed(2)} (${bmiInfo.category})\n`;
    } else {
        shareText += `📊 BMI: ยังไม่มีข้อมูล\n`;
    }

    if (latestTdee) {
        shareText += `🔥 TDEE: ${latestTdee.value.toLocaleString('en-US', { maximumFractionDigits: 0 })} kcal/วัน\n`;
    } else {
        shareText += `🔥 TDEE: ยังไม่มีข้อมูล\n`;
    }
    
    if (latestFoodAnalysis) {
        shareText += `🥗 มื้อล่าสุด: ${latestFoodAnalysis.description} (~${latestFoodAnalysis.calories.toFixed(0)} kcal)\n`
    }

    shareText += `\nสรุปโดย "ศูนย์โภชนาการอัจฉริยะ"`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'ภาพรวมสุขภาพของฉัน',
                text: shareText,
            });
        } catch (error) {
            if (!(error instanceof DOMException && error.name === 'AbortError')) {
              console.error('Error sharing summary:', error);
            }
        }
    } else {
        try {
            await navigator.clipboard.writeText(shareText);
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2500);
        } catch (error) {
            console.error('Failed to copy summary:', error);
            alert('ไม่สามารถคัดลอกสรุปได้');
        }
    }
  };

  const Card: React.FC<{ title: string; icon: React.ReactNode; onClick: () => void; children: React.ReactNode; color: string;}> = ({ title, icon, onClick, children, color }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-t-4 ${color}`}>
        <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
            <div className="text-gray-400 dark:text-gray-500">{icon}</div>
        </div>
        <div className="mt-4">
            {children}
        </div>
        <button 
            onClick={onClick} 
            className={`mt-6 w-full font-semibold py-2 px-4 rounded-lg transition-colors bg-opacity-10 hover:bg-opacity-20 ${color.replace('border', 'bg').replace('-t-4', '')} ${color.replace('border', 'text')} dark:bg-opacity-20 dark:hover:bg-opacity-30`}
        >
            ไปยังเครื่องมือ
        </button>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
        <div className="relative">
            <Card title="ดัชนีมวลกาย (BMI)" icon={<ScaleIcon className="w-8 h-8"/>} onClick={() => setActiveView('bmi')} color="border-red-500">
                {latestBmi ? (
                    <div className="text-center">
                        <p className={`text-5xl font-bold my-2 ${bmiInfo?.color}`}>{latestBmi.value.toFixed(2)}</p>
                        <p className={`text-xl font-semibold ${bmiInfo?.color}`}>{bmiInfo?.category}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            บันทึกเมื่อ: {new Date(latestBmi.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                ) : (
                    <p className="text-center text-gray-600 dark:text-gray-300 py-8">ยังไม่มีข้อมูล BMI เริ่มคำนวณเพื่อดูผลลัพธ์ของคุณที่นี่</p>
                )}
            </Card>
        </div>

        <Card title="การเผาผลาญพลังงาน (TDEE)" icon={<FireIcon className="w-8 h-8"/>} onClick={() => setActiveView('tdee')} color="border-sky-500">
            {latestTdee ? (
                 <div className="text-center">
                    <p className="text-5xl font-bold my-2 text-sky-600 dark:text-sky-400">{latestTdee.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                    <p className="text-xl font-semibold text-sky-600 dark:text-sky-400">กิโลแคลอรี่/วัน</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                         บันทึกเมื่อ: {new Date(latestTdee.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
            ) : (
                <p className="text-center text-gray-600 dark:text-gray-300 py-8">ยังไม่มีข้อมูล TDEE เริ่มคำนวณเพื่อวางแผนพลังงานของคุณ</p>
            )}
        </Card>

        <Card title="มื้ออาหารล่าสุด" icon={<CameraIcon className="w-8 h-8"/>} onClick={() => setActiveView('food')} color="border-purple-500">
             {latestFoodAnalysis ? (
                 <div className="text-center">
                    <p className="text-lg font-semibold text-gray-800 dark:text-white truncate" title={latestFoodAnalysis.description}>{latestFoodAnalysis.description}</p>
                    <p className="text-4xl font-bold my-1 text-purple-600 dark:text-purple-400">{latestFoodAnalysis.calories.toFixed(0)}</p>
                    <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">กิโลแคลอรี่</p>
                </div>
            ) : (
                <p className="text-center text-gray-600 dark:text-gray-300 py-8">
                    ใช้ AI วิเคราะห์คุณค่าทางโภชนาการจากภาพถ่ายมื้ออาหารของคุณ
                </p>
            )}
        </Card>
        
        {(latestBmi || latestTdee || latestFoodAnalysis) && (
             <div className="flex justify-center">
                <button
                    onClick={handleShareSummary}
                    className="inline-flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-3 px-6 rounded-full hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800 transition-all duration-300 transform hover:scale-105"
                    aria-label="แชร์ภาพรวมสุขภาพ"
                >
                    <ShareIcon className="w-5 h-5" />
                    {copyStatus === 'copied' ? 'คัดลอกแล้ว!' : 'แชร์ภาพรวม'}
                </button>
            </div>
        )}
    </div>
  );
};

export default Dashboard;