import React, { createContext, ReactNode, useState, useEffect, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { AppView, BMIHistoryEntry, TDEEHistoryEntry, NutrientInfo, FoodHistoryEntry, UserProfile, Theme, PlannerHistoryEntry, User, AppContextType } from '../types';
import { PLANNER_ACTIVITY_LEVELS } from '../constants';
import { fetchAllDataFromSheet, saveDataToSheet, clearHistoryInSheet } from '../services/googleSheetService';

const defaultProfile: UserProfile = {
  gender: 'male',
  age: '',
  weight: '',
  height: '',
  waist: '',
  hip: '',
  activityLevel: PLANNER_ACTIVITY_LEVELS[2].value,
};

const getInitialTheme = (): Theme => {
    if (typeof window !== 'undefined') {
        const storedTheme = window.localStorage.getItem('theme');
        if (storedTheme === 'dark' || storedTheme === 'light') {
            return storedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
};

export const AppContext = createContext<AppContextType>({} as AppContextType);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<AppView>('home');
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [theme, setTheme] = useLocalStorage<Theme>('theme', getInitialTheme());
  const [bmiHistory, _setBmiHistory] = useLocalStorage<BMIHistoryEntry[]>('bmiHistory', []);
  const [tdeeHistory, _setTdeeHistory] = useLocalStorage<TDEEHistoryEntry[]>('tdeeHistory', []);
  const [foodHistory, _setFoodHistory] = useLocalStorage<FoodHistoryEntry[]>('foodHistory', []);
  const [plannerHistory, _setPlannerHistory] = useLocalStorage<PlannerHistoryEntry[]>('plannerHistory', []);
  const [latestFoodAnalysis, setLatestFoodAnalysis] = useLocalStorage<NutrientInfo | null>('latestFoodAnalysis', null);
  const [userProfile, _setUserProfile] = useLocalStorage<UserProfile>('userProfile', defaultProfile);
  const [scriptUrl, setScriptUrl] = useLocalStorage<string>('googleScriptUrl', 'https://script.google.com/macros/s/AKfycbx6e8zDxmmoZWg2iW_oQHlpfqWZrpS-2Vkq9aFPlnW5MVdGPf8_-yaEJ7iugtdAWvJT/exec');
  const [isDataSynced, setIsDataSynced] = useState(true);

  // --- Auth Functions ---
  const login = (user: User) => {
    setCurrentUser(user);
    // When a new user logs in, we should clear old data
    _setUserProfile(defaultProfile);
    _setBmiHistory([]);
    _setTdeeHistory([]);
    _setFoodHistory([]);
    _setPlannerHistory([]);
    setLatestFoodAnalysis(null);
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveView('home');
  };

  // ดึงข้อมูลทั้งหมดจาก Google Sheet เมื่อเปิดแอป
  useEffect(() => {
    const loadAllData = async () => {
      if (scriptUrl && currentUser) {
        setIsDataSynced(false);
        const fetchedData = await fetchAllDataFromSheet(scriptUrl, currentUser);
        if (fetchedData) {
          _setUserProfile(fetchedData.profile || defaultProfile);
          _setBmiHistory(fetchedData.bmiHistory);
          _setTdeeHistory(fetchedData.tdeeHistory);
          _setFoodHistory(fetchedData.foodHistory);
          _setPlannerHistory(fetchedData.plannerHistory);
        }
        setIsDataSynced(true);
      }
    };
    loadAllData();
  }, [scriptUrl, currentUser]);

  // --- Wrapper Functions for State Management and Syncing ---

  const setUserProfile = useCallback((profileData: UserProfile, accountData: { displayName: string; profilePicture: string; }) => {
    if (!currentUser) return;
    
    // 1. Create the updated user object
    const updatedUser = {
        ...currentUser,
        displayName: accountData.displayName,
        profilePicture: accountData.profilePicture
    };
    
    // 2. Update the state in the context
    setCurrentUser(updatedUser);
    _setUserProfile(profileData);
    
    // 3. Save to Google Sheet using the updated user object
    if (scriptUrl) {
        saveDataToSheet(scriptUrl, 'profile', profileData, updatedUser);
    }
}, [scriptUrl, currentUser, setCurrentUser, _setUserProfile]);

  const setBmiHistory = useCallback((value: React.SetStateAction<BMIHistoryEntry[]>) => {
    if (!currentUser) return;
    const newHistory = value instanceof Function ? value(bmiHistory) : value;
    _setBmiHistory(newHistory);
    if (scriptUrl && newHistory.length > 0) saveDataToSheet(scriptUrl, 'bmiHistory', newHistory, currentUser);
  }, [scriptUrl, _setBmiHistory, bmiHistory, currentUser]);
  
  const setTdeeHistory = useCallback((value: React.SetStateAction<TDEEHistoryEntry[]>) => {
    if (!currentUser) return;
    const newHistory = value instanceof Function ? value(tdeeHistory) : value;
    _setTdeeHistory(newHistory);
    if (scriptUrl && newHistory.length > 0) saveDataToSheet(scriptUrl, 'tdeeHistory', newHistory, currentUser);
  }, [scriptUrl, _setTdeeHistory, tdeeHistory, currentUser]);

  const setFoodHistory = useCallback((value: React.SetStateAction<FoodHistoryEntry[]>) => {
    if (!currentUser) return;
    const newHistory = value instanceof Function ? value(foodHistory) : value;
    _setFoodHistory(newHistory);
    if (scriptUrl && newHistory.length > 0) saveDataToSheet(scriptUrl, 'foodHistory', newHistory, currentUser);
  }, [scriptUrl, _setFoodHistory, foodHistory, currentUser]);
  
  const setPlannerHistory = useCallback((value: React.SetStateAction<PlannerHistoryEntry[]>) => {
    if (!currentUser) return;
    const newHistory = value instanceof Function ? value(plannerHistory) : value;
    _setPlannerHistory(newHistory);
    if (scriptUrl && newHistory.length > 0) saveDataToSheet(scriptUrl, 'plannerHistory', newHistory, currentUser);
  }, [scriptUrl, _setPlannerHistory, plannerHistory, currentUser]);

  const clearBmiHistory = useCallback(() => {
    if (!currentUser) return;
    _setBmiHistory([]);
    if (scriptUrl) clearHistoryInSheet(scriptUrl, 'bmiHistory', currentUser);
  }, [scriptUrl, _setBmiHistory, currentUser]);
  
  const clearTdeeHistory = useCallback(() => {
     if (!currentUser) return;
    _setTdeeHistory([]);
    if (scriptUrl) clearHistoryInSheet(scriptUrl, 'tdeeHistory', currentUser);
  }, [scriptUrl, _setTdeeHistory, currentUser]);
  
  const clearFoodHistory = useCallback(() => {
     if (!currentUser) return;
    _setFoodHistory([]);
    if (scriptUrl) clearHistoryInSheet(scriptUrl, 'foodHistory', currentUser);
  }, [scriptUrl, _setFoodHistory, currentUser]);


  return (
    <AppContext.Provider value={{ 
        activeView, setActiveView,
        currentUser, login, logout,
        theme, setTheme,
        bmiHistory, setBmiHistory, 
        tdeeHistory, setTdeeHistory,
        foodHistory, setFoodHistory,
        plannerHistory, setPlannerHistory,
        latestFoodAnalysis, setLatestFoodAnalysis,
        userProfile, setUserProfile,
        scriptUrl, setScriptUrl,
        isDataSynced,
        clearBmiHistory,
        clearTdeeHistory,
        clearFoodHistory,
    }}>
      {children}
    </AppContext.Provider>
  );
};
