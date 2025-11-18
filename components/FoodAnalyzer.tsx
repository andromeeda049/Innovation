import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { analyzeFoodFromImage, analyzeFoodFromText, getLocalFoodSuggestions } from '../services/geminiService';
import { NutrientInfo, FoodHistoryEntry, LocalFoodSuggestion } from '../types';
import { ShareIcon, CameraIcon, XCircleIcon, TrashIcon, EyeIcon, ChatBubbleLeftEllipsisIcon, MapPinIcon } from './icons';
import { AppContext } from '../context/AppContext';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    base64: await base64EncodedDataPromise,
    mimeType: file.type
  };
};

const Spinner: React.FC<{ text?: string }> = ({ text = "กำลังวิเคราะห์... โปรดรอสักครู่" }) => (
  <div className="flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 border-4 border-t-purple-500 border-gray-200 dark:border-gray-600 rounded-full animate-spin"></div>
    <p className="text-purple-600 dark:text-purple-400 font-medium">{text}</p>
  </div>
);

const NutrientDisplay: React.FC<{ label: string; value: number; unit: string; color: string }> = ({ label, value, unit, color }) => (
    <div className="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value.toFixed(0)}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{unit}</p>
    </div>
);

const CameraModal: React.FC<{ isOpen: boolean; onClose: () => void; onCapture: (file: File) => void; }> = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startCamera = useCallback(async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error("Error accessing camera:", error);
                alert("ไม่สามารถเข้าถึงกล้องได้ โปรดตรวจสอบการอนุญาต");
                onClose();
            }
        }
    }, [onClose]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen, startCamera, stopCamera]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            canvas.toBlob(blob => {
                if (blob) {
                    const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
                    onCapture(file);
                    onClose();
                }
            }, 'image/jpeg', 0.95);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="relative bg-black rounded-2xl shadow-xl w-full max-w-lg p-2" onClick={e => e.stopPropagation()}>
                <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-lg" />
                <canvas ref={canvasRef} className="hidden" />
                <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/50 rounded-full" aria-label="Close camera">
                    <XCircleIcon className="w-10 h-10" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <button onClick={handleCapture} className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 ring-4 ring-white/50" aria-label="Take picture"></button>
                </div>
            </div>
        </div>
    );
};

const GuestLock: React.FC = () => (
    <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center rounded-lg text-center p-4 z-10">
        <p className="font-semibold text-gray-700 dark:text-gray-300">🔒 กรุณาสร้างโปรไฟล์เพื่อใช้งานฟีเจอร์ AI</p>
    </div>
);

const MAX_HISTORY_ITEMS = 15;
type Mode = 'image' | 'text' | 'location';

const FoodAnalyzer: React.FC = () => {
  const [mode, setMode] = useState<Mode>('image');
  // Image mode states
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  // Text mode states
  const [inputText, setInputText] = useState<string>('');
  // Location mode states
  const [suggestions, setSuggestions] = useState<LocalFoodSuggestion[] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Common states
  const [result, setResult] = useState<NutrientInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const { 
      setLatestFoodAnalysis, 
      foodHistory, 
      setFoodHistory,
      clearFoodHistory,
      apiKey,
      currentUser
  } = useContext(AppContext);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const isGuest = currentUser?.role === 'guest';

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setResult(null);
    setError(null);
    setSuggestions(null);
    setLocationError(null);
    setImage(null);
    setPreview(null);
    setInputText('');
    setLatestFoodAnalysis(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  // --- Image Mode Functions ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
    setLatestFoodAnalysis(null);
  }

  const handleImageAnalyze = async () => {
    if (!image || isGuest) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { base64, mimeType } = await fileToGenerativePart(image);
      const analysisResult = await analyzeFoodFromImage(base64, mimeType, apiKey);
      setResult(analysisResult);
      saveResultToHistory(analysisResult);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด');
    } finally {
      setLoading(false);
    }
  };

  // --- Text Mode Functions ---
  const handleTextAnalyze = async () => {
    if (!inputText.trim() || isGuest) {
        if (!inputText.trim()) setError("กรุณาป้อนชื่ออาหารหรือคำอธิบาย");
        return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
        const analysisResult = await analyzeFoodFromText(inputText, apiKey);
        setResult(analysisResult);
        saveResultToHistory(analysisResult);
    } catch (err: any) {
        setError(err.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด');
    } finally {
        setLoading(false);
    }
  };

  // --- Location Mode Functions ---
  const handleLocationAnalyze = () => {
    if (isGuest) return;
    setLoading(true);
    setLocationError(null);
    setSuggestions(null);

    if (!navigator.geolocation) {
        setLocationError("เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง");
        setLoading(false);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const suggestionResult = await getLocalFoodSuggestions(latitude, longitude, apiKey);
                setSuggestions(suggestionResult);
            } catch (err: any) {
                setLocationError(err.message || 'เกิดข้อผิดพลาดในการค้นหา');
            } finally {
                setLoading(false);
            }
        },
        (error) => {
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    setLocationError("คุณปฏิเสธการเข้าถึงตำแหน่ง โปรดเปิดการอนุญาตในตั้งค่าเบราว์เซอร์");
                    break;
                case error.POSITION_UNAVAILABLE:
                    setLocationError("ไม่สามารถระบุตำแหน่งได้ อาจเกิดจากสัญญาณอ่อน โปรดลองอีกครั้งในที่โล่ง");
                    break;
                case error.TIMEOUT:
                    setLocationError("หมดเวลาในการร้องขอตำแหน่ง โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
                    break;
                default:
                    setLocationError("เกิดข้อผิดพลาดที่ไม่รู้จักในการระบุตำแหน่ง กรุณาลองใหม่อีกครั้ง");
                    break;
            }
            setLoading(false);
        }
    );
  };
  
  // --- Common Functions ---
  const saveResultToHistory = (analysisResult: NutrientInfo) => {
    setLatestFoodAnalysis(analysisResult);
    const newEntry: FoodHistoryEntry = {
        id: new Date().toISOString(),
        date: new Date().toISOString(),
        analysis: analysisResult
    };
    setFoodHistory(prev => [newEntry, ...prev].slice(0, MAX_HISTORY_ITEMS));
  };
  
  const handleShare = async () => {
    if (!result) return;
    let shareText = `ผลการวิเคราะห์อาหารของฉัน:\n\n- ภาพรวม: ${result.description}\n- แคลอรี่ทั้งหมด: ${result.calories.toFixed(0)} kcal\n\nรายการอาหาร:\n`;
    result.items.forEach(item => {
        shareText += `- ${item.name}: ~${item.calories.toFixed(0)} kcal\n`;
    });
    shareText += `\n- โปรตีน: ${result.protein.toFixed(0)} g\n- คาร์โบไฮเดรต: ${result.carbohydrates.toFixed(0)} g\n- ไขมัน: ${result.fat.toFixed(0)} g\n\nวิเคราะห์โดย "ศูนย์โภชนาการอัจฉริยะ"`;
    if (navigator.share) {
      try { 
        await navigator.share({ title: 'ผลการวิเคราะห์อาหาร', text: shareText }); 
      } catch (error) { 
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Error sharing:', error); 
        }
      }
    } else {
      try { await navigator.clipboard.writeText(shareText); setCopyStatus('copied'); setTimeout(() => setCopyStatus('idle'), 2500); } catch (error) { console.error('Failed to copy:', error); alert('ไม่สามารถคัดลอกผลลัพธ์ได้'); }
    }
  };
  
  const handleResetImage = () => {
      setImage(null);
      setPreview(null);
      setResult(null);
      setError(null);
      setLatestFoodAnalysis(null);
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  }

  const handleViewHistoryItem = (item: FoodHistoryEntry) => {
    handleModeChange('image');
    setTimeout(() => {
        setResult(item.analysis);
        setLatestFoodAnalysis(item.analysis);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  };
  
  const handleDeleteHistoryItem = (id: string) => {
    setFoodHistory(prev => prev.filter(item => item.id !== id));
    setItemToDelete(null);
  };

  const confirmClearHistory = () => {
    if (itemToDelete) {
        handleDeleteHistoryItem(itemToDelete);
    } else {
        clearFoodHistory();
    }
    setShowConfirmDialog(false);
  };

  const cancelClearHistory = () => {
    setShowConfirmDialog(false);
    setItemToDelete(null);
  };

  const totalMacros = (result?.protein ?? 0) + (result?.carbohydrates ?? 0) + (result?.fat ?? 0);

  const tabs = [
    { id: 'image' as Mode, label: 'จากภาพ', icon: <CameraIcon className="w-5 h-5" /> },
    { id: 'text' as Mode, label: 'จากข้อความ', icon: <ChatBubbleLeftEllipsisIcon className="w-5 h-5" /> },
    { id: 'location' as Mode, label: 'อาหารท้องถิ่น', icon: <MapPinIcon className="w-5 h-5" /> },
  ];

  return (
    <>
      <CameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={processFile}/>
      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full transform transition-all duration-300">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">วิเคราะห์อาหาร</h2>
        
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            {tabs.map(tab => (
                <button
                key={tab.id}
                onClick={() => handleModeChange(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-1 sm:px-4 py-3 font-semibold transition-colors duration-200 focus:outline-none text-sm sm:text-base ${
                    mode === tab.id
                    ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white border-b-2 border-transparent'
                }`}
                >
                {tab.icon}
                <span>{tab.label}</span>
                </button>
            ))}
        </div>

        {/* --- Analysis Input Section --- */}
        {mode === 'image' && (
             <div className="flex flex-col items-center gap-4 animate-fade-in relative">
                {isGuest && <GuestLock />}
                <div
                    className="w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-gray-700/50 transition-colors relative"
                    onClick={() => !preview && fileInputRef.current?.click()}
                >
                    {preview ? <img src={preview} alt="Food preview" className="object-cover h-full w-full rounded-lg" />
                    : <div className="text-center">
                        <p>คลิกเพื่อเลือกรูปภาพ</p>
                        <p className="text-sm">หรือ</p>
                        <button onClick={(e) => { e.stopPropagation(); setIsCameraOpen(true); }} className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"><CameraIcon className="w-5 h-5"/>ถ่ายภาพ</button>
                    </div>}
                    {preview && <button onClick={handleResetImage} className="absolute top-2 right-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors" aria-label="Remove image"><XCircleIcon className="w-8 h-8"/></button>}
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button onClick={handleImageAnalyze} disabled={!image || loading || isGuest} className="w-full bg-purple-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100">{loading ? 'กำลังประมวลผล...' : 'วิเคราะห์รูปภาพ'}</button>
            </div>
        )}

        {mode === 'text' && (
            <div className="flex flex-col items-center gap-4 animate-fade-in relative">
                {isGuest && <GuestLock />}
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="ป้อนชื่ออาหารหรือคำอธิบาย...&#10;เช่น ข้าวผัดกะเพราหมูสับไข่ดาว"
                    className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                />
                <button onClick={handleTextAnalyze} disabled={!inputText.trim() || loading || isGuest} className="w-full bg-purple-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100">{loading ? 'กำลังประมวลผล...' : 'วิเคราะห์ข้อความ'}</button>
            </div>
        )}

        {mode === 'location' && (
            <div className="flex flex-col items-center gap-4 text-center animate-fade-in relative">
                {isGuest && <GuestLock />}
                <p className="text-gray-600 dark:text-gray-300">ให้ AI แนะนำเมนูอาหารท้องถิ่นที่น่าสนใจตามตำแหน่งปัจจุบันของคุณ</p>
                <button onClick={handleLocationAnalyze} disabled={loading || isGuest} className="w-full bg-purple-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100">{loading ? 'กำลังค้นหา...' : 'ค้นหาอาหารท้องถิ่น'}</button>
            </div>
        )}
        
        {/* --- Result Display Section --- */}
        <div className="mt-8">
            {loading && <Spinner text={mode === 'location' ? 'กำลังค้นหาตำแหน่ง...' : 'กำลังวิเคราะห์...'} />}
            {error && <p className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 dark:text-red-400 p-3 rounded-lg">{error}</p>}
            {locationError && <p className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 dark:text-red-400 p-3 rounded-lg">{locationError}</p>}
            
            {result && (mode === 'image' || mode === 'text') && (
                <div className="space-y-6 animate-fade-in">
                    <div className="text-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><p className="text-lg font-medium text-gray-800 dark:text-white">{result.description}</p><p className="text-5xl font-bold my-2 text-purple-600 dark:text-purple-400">{result.calories.toFixed(0)}</p><p className="text-xl font-semibold text-purple-600 dark:text-purple-400">กิโลแคลอรี่ (โดยประมาณ)</p></div>
                    {result.items && result.items.length > 0 && (<div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">รายการอาหารที่พบ:</h4><ul className="space-y-1 text-gray-600 dark:text-gray-300">{result.items.map((item, index) => (<li key={index} className="flex justify-between"><span>- {item.name}</span><span>~{item.calories.toFixed(0)} kcal</span></li>))}</ul></div>)}
                    <div className="grid grid-cols-3 gap-3"><NutrientDisplay label="โปรตีน" value={result.protein} unit="กรัม" color="text-red-500 dark:text-red-400" /><NutrientDisplay label="คาร์โบไฮเดรต" value={result.carbohydrates} unit="กรัม" color="text-blue-500 dark:text-blue-400" /><NutrientDisplay label="ไขมัน" value={result.fat} unit="กรัม" color="text-yellow-500 dark:text-yellow-400" /></div>
                    <div><h4 className="text-md font-semibold text-center text-gray-700 dark:text-gray-200 mb-2">สัดส่วนสารอาหารหลัก</h4><div className="flex w-full h-4 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden"><div className="bg-red-500" style={{ width: `${(result.protein / totalMacros) * 100}%` }}></div><div className="bg-blue-500" style={{ width: `${(result.carbohydrates / totalMacros) * 100}%` }}></div><div className="bg-yellow-500" style={{ width: `${(result.fat / totalMacros) * 100}%` }}></div></div><div className="flex justify-around mt-2 text-xs"><span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>โปรตีน</span><span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>คาร์บ</span><span className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5"></span>ไขมัน</span></div></div>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">*ค่าที่แสดงเป็นค่าประมาณการจาก AI และอาจไม่ถูกต้อง 100%</p>
                    <button onClick={handleShare} className="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800 transition-all duration-300 transform hover:scale-105" aria-label="แชร์ผลการวิเคราะห์อาหาร"><ShareIcon className="w-5 h-5" />{copyStatus === 'copied' ? 'คัดลอกแล้ว!' : 'แชร์ผลลัพธ์'}</button>
                </div>
            )}
            
            {suggestions && mode === 'location' && (
                <div className="animate-fade-in">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 text-center">เมนูท้องถิ่นน่าสนใจใกล้คุณ</h3>
                    <div className="space-y-4">
                        {suggestions.map((item, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-purple-400">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">{item.name}</h4>
                                    <span className="text-purple-600 dark:text-purple-400 font-bold">~{item.calories.toFixed(0)} kcal</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>

      {foodHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full mt-8 animate-fade-in">
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-gray-800 dark:text-white">ประวัติการวิเคราะห์</h3><button onClick={() => { setItemToDelete(null); setShowConfirmDialog(true); }} className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 transition-colors" aria-label="ล้างประวัติการวิเคราะห์อาหาร"><TrashIcon className="w-4 h-4" />ล้างประวัติ</button></div>
            <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {foodHistory.map((entry) => (<li key={entry.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"><div className="flex-1 min-w-0"><p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{entry.analysis.description}</p><p className="text-sm text-purple-600 dark:text-purple-400 font-medium">~{entry.analysis.calories.toFixed(0)} kcal</p><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(entry.date).toLocaleString('th-TH')}</p></div><div className="flex items-center gap-2 ml-4"><button onClick={() => handleViewHistoryItem(entry)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400" aria-label="ดูรายละเอียด"><EyeIcon className="w-5 h-5"/></button><button onClick={() => { setItemToDelete(entry.id); setShowConfirmDialog(true); }} className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400" aria-label="ลบรายการ"><TrashIcon className="w-5 h-5"/></button></div></li>))}
            </ul>
        </div>
      )}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 animate-fade-in" onClick={cancelClearHistory} role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title-food">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 transform transition-all duration-300 scale-95 animate-scale-in" onClick={(e) => e.stopPropagation()}>
                <h3 id="confirm-dialog-title-food" className="text-xl font-bold text-gray-800 dark:text-white">ยืนยันการลบ</h3><p className="mt-2 text-gray-600 dark:text-gray-300">{itemToDelete ? 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?' : 'คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติทั้งหมด?'}</p>
                <div className="mt-6 flex justify-end gap-3"><button onClick={cancelClearHistory} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors">ยกเลิก</button><button onClick={confirmClearHistory} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">ยืนยัน</button></div>
            </div>
        </div>
      )}
    </>
  );
};

export default FoodAnalyzer;