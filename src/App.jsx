import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Clock, 
  MapPin, 
  TrendingUp, 
  Heart, 
  Zap, 
  BarChart2, 
  PlusCircle, 
  List, 
  Target,
  Brain,
  Trash2,
  CalendarDays,
  BatteryCharging,
  ChevronRight,
  ChevronLeft,
  Save
} from 'lucide-react';

const RunningLogApp = () => {
  // --- Helper: Local Date String (YYYY-MM-DD) ---
  const getLocalISODate = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // --- State Management ---
  const [view, setView] = useState('dashboard');
  const [logs, setLogs] = useState([]);
  const [weeklyPlans, setWeeklyPlans] = useState({});
  
  // Navigation State for Planning View (default to today)
  const [currentPlanDate, setCurrentPlanDate] = useState(new Date());

  // Form State
  const [formData, setFormData] = useState({
    date: getLocalISODate(),
    planText: '',
    distance: '',
    hours: 0,
    minutes: 0,
    seconds: 0,
    elevation: '',
    heartRate: '',
    relativeEffort: '', 
    bodyBattery: '',    
    rpe: 5,
    analysisText: ''
  });

  // --- Effects ---
  useEffect(() => {
    const savedLogs = localStorage.getItem('runningLogs');
    const savedPlans = localStorage.getItem('runningPlans');
    
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedPlans) setWeeklyPlans(JSON.parse(savedPlans));
  }, []);

  useEffect(() => {
    localStorage.setItem('runningLogs', JSON.stringify(logs));
  }, [logs]);

  // Auto-save plans whenever they change (background save)
  useEffect(() => {
    localStorage.setItem('runningPlans', JSON.stringify(weeklyPlans));
  }, [weeklyPlans]);

  // --- Helper Functions ---
  const calculatePace = (dist, h, m, s) => {
    if (!dist || dist <= 0) return "0'00\"";
    const totalMinutes = (parseInt(h || 0) * 60) + parseInt(m || 0) + (parseInt(s || 0) / 60);
    const paceDecimal = totalMinutes / parseFloat(dist);
    const paceMin = Math.floor(paceDecimal);
    const paceSec = Math.round((paceDecimal - paceMin) * 60);
    return `${paceMin}'${paceSec.toString().padStart(2, '0')}"`;
  };

  const currentPace = calculatePace(formData.distance, formData.hours, formData.minutes, formData.seconds);

  const formatDate = (dateString) => {
    const options = { month: 'long', day: 'numeric', weekday: 'long' };
    return new Date(dateString).toLocaleDateString('ko-KR', options);
  };
  
  const getDayName = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', { weekday: 'short' });
  };

  const getWeekLabel = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const weekNum = Math.ceil((day + 6 - (date.getDay() || 7)) / 7);
    const month = date.getMonth() + 1;
    return `${month}월 ${weekNum}주차`;
  };

  const getWeekDates = (baseDate) => {
    const dayOfWeek = baseDate.getDay() || 7; 
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() - dayOfWeek + 1); 
    
    const weekDates = [];
    for(let i=0; i<7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDates.push(getLocalISODate(d));
    }
    return weekDates;
  };

  // --- Week Navigation Handlers ---
  const moveWeek = (direction) => {
    const newDate = new Date(currentPlanDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentPlanDate(newDate);
  };

  const handleDateJump = (e) => {
    const selectedDate = new Date(e.target.value);
    if (!isNaN(selectedDate.getTime())) {
      setCurrentPlanDate(selectedDate);
    }
  };

  // --- Dashboard Logic ---
  const weekDates = getWeekDates(currentPlanDate);
  const weekRangeLabel = `${weekDates[0].slice(5).replace('-','/')} - ${weekDates[6].slice(5).replace('-','/')}`; 
  const currentYearMonth = `${new Date(weekDates[0]).getFullYear()}년 ${new Date(weekDates[0]).getMonth() + 1}월`;

  const totalPlannedMinutes = weekDates.reduce((acc, date) => {
    return acc + (parseInt(weeklyPlans[date]) || 0);
  }, 0);

  const currentWeekLogs = logs.filter(log => weekDates.includes(log.date));
  
  const weeklyActualStats = currentWeekLogs.reduce((acc, log) => {
    return {
      distance: acc.distance + parseFloat(log.distance || 0),
      timeSeconds: acc.timeSeconds + (log.totalTimeSeconds || 0)
    };
  }, { distance: 0, timeSeconds: 0 });

  const weeklyActualMinutes = Math.round(weeklyActualStats.timeSeconds / 60);
  
  const timeProgress = totalPlannedMinutes > 0 
    ? Math.min((weeklyActualMinutes / totalPlannedMinutes) * 100, 100) 
    : 0;

  const totalDistance = logs.reduce((acc, log) => acc + parseFloat(log.distance || 0), 0).toFixed(1);
  const totalRuns = logs.length;

  const plannedTimeForSelectedDate = weeklyPlans[formData.date] || 0;

  // --- Handlers ---
  const handlePlanChange = (date, minutes) => {
    setWeeklyPlans(prev => ({
      ...prev,
      [date]: minutes
    }));
  };

  const handleSavePlan = () => {
    localStorage.setItem('runningPlans', JSON.stringify(weeklyPlans));
    alert('주간 계획이 저장되었습니다!');
    setView('dashboard');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newLog = {
      id: Date.now(),
      ...formData,
      pace: currentPace,
      totalTimeSeconds: (parseInt(formData.hours || 0) * 3600) + (parseInt(formData.minutes || 0) * 60) + parseInt(formData.seconds || 0)
    };
    
    const updatedLogs = [newLog, ...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
    setLogs(updatedLogs);
    
    setFormData({
      ...formData,
      planText: '',
      distance: '',
      hours: 0,
      minutes: 0,
      seconds: 0,
      elevation: '',
      heartRate: '',
      relativeEffort: '',
      bodyBattery: '',
      rpe: 5,
      analysisText: ''
    });
    setView('dashboard');
  };

  const deleteLog = (id) => {
    if(window.confirm('이 기록을 삭제하시겠습니까?')) {
      setLogs(logs.filter(log => log.id !== id));
    }
  };

  const NavButton = ({ icon: Icon, label, viewName }) => (
    <button 
      onClick={() => setView(viewName)}
      className={`flex flex-col items-center justify-center w-full py-3 ${view === viewName ? 'text-blue-600 font-bold' : 'text-gray-400'}`}
    >
      <Icon size={24} className="mb-1" />
      <span className="text-[10px]">{label}</span>
    </button>
  );

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800 max-w-md mx-auto shadow-xl overflow-hidden flex flex-col relative">
      
      {/* Header */}
      <header className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-extrabold text-blue-600 italic tracking-tighter">RUNLOG<span className="text-gray-800 not-italic font-normal text-sm ml-1">Plan</span></h1>
        </div>
        <div className="text-right">
           <div className="text-[10px] text-gray-400 font-bold">{currentYearMonth}</div>
           <div className="text-xs text-gray-600 font-bold bg-gray-100 px-2 py-1 rounded-lg flex items-center">
             {weekRangeLabel}
           </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        
        {/* VIEW: DASHBOARD */}
        {view === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Total Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 p-4 rounded-2xl text-white shadow-lg">
                <div className="flex items-center space-x-2 opacity-80 mb-1">
                  <MapPin size={16} />
                  <span className="text-xs font-semibold">누적 거리</span>
                </div>
                <div className="text-3xl font-bold">{totalDistance}<span className="text-sm font-normal ml-1">km</span></div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                 <div className="flex items-center space-x-2 text-gray-500 mb-1">
                  <Activity size={16} />
                  <span className="text-xs font-semibold">총 러닝 횟수</span>
                </div>
                <div className="text-3xl font-bold text-gray-800">{totalRuns}<span className="text-sm font-normal ml-1">회</span></div>
              </div>
            </div>

            {/* Weekly Plan Achievement */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center">
                  <Target size={18} className="mr-2 text-blue-600" />
                  주간 계획 달성
                </h3>
                <button onClick={() => setView('planning')} className="text-xs text-blue-500 font-bold bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100">
                  계획 수정
                </button>
              </div>

              {/* Time Progress */}
              <div className="text-center py-2">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-gray-500">진행률</span>
                  <span className="text-blue-600 text-lg">{Math.round(timeProgress)}%</span>
                </div>
                
                <div className="w-full bg-gray-100 rounded-full h-4 mb-2 overflow-hidden relative">
                  <div className="absolute inset-0 w-full h-full opacity-10" style={{backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem'}}></div>
                  <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-4 rounded-full transition-all duration-1000 ease-out shadow-md" style={{ width: `${timeProgress}%` }}></div>
                </div>

                <div className="flex justify-between items-end mt-2">
                   <div className="text-left">
                      <div className="text-[10px] text-gray-400">실행 시간</div>
                      <div className="text-xl font-bold text-gray-800">{weeklyActualMinutes}<span className="text-sm font-normal text-gray-500 ml-1">분</span></div>
                   </div>
                   <div className="text-right">
                      <div className="text-[10px] text-gray-400">계획 시간</div>
                      <div className="text-xl font-bold text-blue-600">{totalPlannedMinutes}<span className="text-sm font-normal text-gray-500 ml-1">분</span></div>
                   </div>
                </div>
              </div>
            </div>

            {/* Recent Logs Preview */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-700">최근 기록</h3>
                <button onClick={() => setView('list')} className="text-xs text-blue-500 font-medium">전체보기</button>
              </div>
              <div className="space-y-3">
                {logs.slice(0, 3).map(log => (
                  <div key={log.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                    <div>
                      <div className="text-xs text-gray-400 font-medium mb-1">{getWeekLabel(log.date)} • {formatDate(log.date)}</div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-lg font-bold text-gray-800">{log.distance}km</span>
                        <span className="text-sm text-gray-500">{log.pace}/km</span>
                      </div>
                    </div>
                    {log.bodyBattery && (
                       <div className="flex items-center text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                          <BatteryCharging size={12} className="mr-1" /> -{log.bodyBattery}
                       </div>
                    )}
                  </div>
                ))}
                {logs.length === 0 && <div className="text-center py-6 text-gray-400 text-sm">아직 기록이 없습니다.</div>}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: PLANNING */}
        {view === 'planning' && (
          <div className="animate-fade-in space-y-4">
            {/* Date Navigation */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
               <button onClick={() => moveWeek(-1)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full">
                 <ChevronLeft size={20} />
               </button>
               
               <div className="flex flex-col items-center">
                 <div className="flex items-center space-x-2">
                   <span className="text-sm font-bold text-gray-800">{currentYearMonth}</span>
                   <div className="relative">
                      <CalendarDays size={16} className="text-blue-500 cursor-pointer" />
                      <input 
                        type="date" 
                        onChange={handleDateJump}
                        className="absolute inset-0 opacity-0 cursor-pointer w-6 h-6"
                        title="특정 날짜로 이동"
                      />
                   </div>
                 </div>
                 <div className="text-xs text-gray-500">{weekRangeLabel}</div>
               </div>

               <button onClick={() => moveWeek(1)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full">
                 <ChevronRight size={20} />
               </button>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4 flex justify-between items-center">
               <div>
                  <h2 className="text-lg font-bold text-gray-800">주간 목표 설정</h2>
                  <p className="text-xs text-gray-500">선택한 주간의 목표 시간을 입력하세요.</p>
               </div>
               <div className="bg-blue-50 p-2 rounded-lg text-center min-w-[80px]">
                  <div className="text-[10px] text-blue-800 font-bold mb-0.5">TOTAL</div>
                  <div className="text-xl font-extrabold text-blue-600">{totalPlannedMinutes}<span className="text-xs font-normal ml-0.5">분</span></div>
               </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
              {weekDates.map((dateString) => {
                const isToday = dateString === getLocalISODate();
                return (
                  <div key={dateString} className={`p-4 border-b border-gray-50 flex items-center justify-between ${isToday ? 'bg-blue-50/50' : ''}`}>
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold uppercase ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                        {getDayName(dateString)}
                      </span>
                      <span className={`text-sm font-medium ${isToday ? 'text-blue-800' : 'text-gray-700'}`}>
                        {new Date(dateString).getDate()}일
                      </span>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        placeholder="0"
                        value={weeklyPlans[dateString] || ''}
                        onChange={(e) => handlePlanChange(dateString, e.target.value)}
                        className={`w-20 p-2 text-right font-bold text-lg rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${weeklyPlans[dateString] > 0 ? 'bg-blue-100 text-blue-800 border-transparent' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
                      />
                      <span className="ml-2 text-xs text-gray-400 font-medium w-4">분</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Save Button for Planning */}
            <button 
              onClick={handleSavePlan}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center mb-6"
            >
              <Save className="mr-2" size={20} />
              주간 계획 저장하기
            </button>
            
            <div className="text-center pb-4">
               <button onClick={() => setView('dashboard')} className="text-sm text-gray-500 underline">저장 없이 나가기</button>
            </div>
          </div>
        )}

        {/* VIEW: ENTRY FORM */}
        {view === 'entry' && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            
            {/* Section 1: Plan & Date */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-blue-600">
                  <Target size={20} className="mr-2" />
                  <h3 className="font-bold">1. 계획 확인 (Plan)</h3>
                </div>
                {/* Display Planned Time Context */}
                <div className={`text-xs px-2 py-1 rounded-lg font-bold ${plannedTimeForSelectedDate > 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                  {plannedTimeForSelectedDate > 0 ? `계획: ${plannedTimeForSelectedDate}분` : '계획 없음'}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">날짜</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">오늘의 목표 (세부 내용)</label>
                  <textarea 
                    placeholder="예: 인터벌 400m x 10회, 빌드업 조깅 등"
                    value={formData.planText}
                    onChange={(e) => setFormData({...formData, planText: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none resize-none h-20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Execution */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-orange-500">
              <div className="flex items-center mb-4 text-orange-600">
                <TrendingUp size={20} className="mr-2" />
                <h3 className="font-bold">2. 실행 (Do)</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">거리 (km)</label>
                  <input 
                    type="number" step="0.01" required placeholder="0.00"
                    value={formData.distance}
                    onChange={(e) => setFormData({...formData, distance: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-lg font-bold text-gray-800 text-center"
                  />
                </div>
                 <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">예상 페이스</label>
                  <div className="w-full bg-gray-100 border border-gray-200 rounded-lg p-2 text-lg font-bold text-gray-600 text-center">
                    {currentPace}<span className="text-xs font-normal ml-1">/km</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 mb-1">시간</label>
                <div className="flex space-x-2">
                  <div className="flex-1"><input type="number" placeholder="0" className="w-full p-2 border rounded-lg text-center" value={formData.hours} onChange={(e) => setFormData({...formData, hours: e.target.value})} /><div className="text-[10px] text-center text-gray-400">시간</div></div>
                  <div className="flex-1"><input type="number" placeholder="0" className="w-full p-2 border rounded-lg text-center" value={formData.minutes} onChange={(e) => setFormData({...formData, minutes: e.target.value})} /><div className="text-[10px] text-center text-gray-400">분</div></div>
                  <div className="flex-1"><input type="number" placeholder="0" className="w-full p-2 border rounded-lg text-center" value={formData.seconds} onChange={(e) => setFormData({...formData, seconds: e.target.value})} /><div className="text-[10px] text-center text-gray-400">초</div></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                   <label className="block text-[10px] font-bold text-gray-500 mb-1">상승고도 (m)</label>
                   <input type="number" className="w-full p-2 border rounded-lg text-sm" placeholder="0" value={formData.elevation} onChange={(e) => setFormData({...formData, elevation: e.target.value})} />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-gray-500 mb-1">심박 (bpm)</label>
                   <input type="number" className="w-full p-2 border rounded-lg text-sm" placeholder="0" value={formData.heartRate} onChange={(e) => setFormData({...formData, heartRate: e.target.value})} />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-gray-500 mb-1">상대적 노력</label>
                   <input type="number" className="w-full p-2 border rounded-lg text-sm bg-yellow-50" placeholder="숫자" value={formData.relativeEffort} onChange={(e) => setFormData({...formData, relativeEffort: e.target.value})} />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 mb-1">배터리 (체력 소모)</label>
                <div className="relative">
                  <BatteryCharging className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input 
                    type="number" 
                    className="w-full pl-10 p-2 border border-gray-200 rounded-lg text-sm text-red-500 font-bold" 
                    placeholder="소모량 (예: 50)" 
                    value={formData.bodyBattery} 
                    onChange={(e) => setFormData({...formData, bodyBattery: e.target.value})} 
                  />
                  <div className="text-[10px] text-gray-400 mt-1 ml-1">* 음수로 자동 기록됩니다</div>
                </div>
              </div>

              <div>
                <label className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                  <span>체감 난이도 (RPE)</span>
                  <span className="text-orange-500 font-bold">{formData.rpe} / 10</span>
                </label>
                <input 
                  type="range" min="1" max="10" 
                  value={formData.rpe}
                  onChange={(e) => setFormData({...formData, rpe: e.target.value})}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
            </div>

            {/* Section 3: Analysis */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-purple-500">
               <div className="flex items-center mb-4 text-purple-600">
                <Brain size={20} className="mr-2" />
                <h3 className="font-bold">3. 분석 (See)</h3>
              </div>
              <textarea 
                placeholder="피드백 작성"
                value={formData.analysisText}
                onChange={(e) => setFormData({...formData, analysisText: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm resize-none h-24 outline-none focus:border-purple-500"
              />
            </div>

            <button type="submit" className="w-full bg-gray-800 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform">
              기록 저장하기
            </button>
          </form>
        )}

        {/* VIEW: LOG LIST */}
        {view === 'list' && (
          <div className="space-y-4 animate-fade-in">
             <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">전체 러닝 로그</h2>
             {logs.map(log => (
               <div key={log.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative">
                  <button onClick={() => deleteLog(log.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>

                  <div className="flex items-center space-x-2 mb-3">
                    <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-1 rounded-full font-bold">
                      {getWeekLabel(log.date)}
                    </span>
                    <span className="text-gray-400 text-xs font-medium">{formatDate(log.date)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 border-b border-gray-50 pb-4">
                     <div>
                       <div className="text-[10px] text-gray-400 uppercase tracking-wide">Distance</div>
                       <div className="text-2xl font-bold text-gray-800">{log.distance} <span className="text-sm font-normal text-gray-500">km</span></div>
                     </div>
                     <div>
                       <div className="text-[10px] text-gray-400 uppercase tracking-wide">Pace</div>
                       <div className="text-2xl font-bold text-gray-800">{log.pace} <span className="text-sm font-normal text-gray-500">/km</span></div>
                     </div>
                  </div>

                  <div className="flex justify-between text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg">
                    <div className="flex items-center"><Clock size={12} className="mr-1"/> 
                      {log.hours > 0 ? `${log.hours}h ` : ''}{log.minutes}m {log.seconds}s
                    </div>
                    {log.heartRate && <div className="flex items-center"><Heart size={12} className="mr-1"/> {log.heartRate}</div>}
                    {log.relativeEffort && <div className="flex items-center"><Zap size={12} className="mr-1"/> 노력 {log.relativeEffort}</div>}
                  </div>

                  {log.bodyBattery && (
                    <div className="mb-4 text-xs font-medium text-red-500 flex items-center justify-end">
                      <BatteryCharging size={14} className="mr-1" /> 체력 소모: -{log.bodyBattery}
                    </div>
                  )}

                  <div className="space-y-2">
                    {log.planText && (
                      <div className="flex items-start">
                        <span className="text-[10px] font-bold text-blue-500 w-8 mt-0.5">계획</span>
                        <p className="text-xs text-gray-600 flex-1">{log.planText}</p>
                      </div>
                    )}
                    {log.analysisText && (
                      <div className="flex items-start">
                         <span className="text-[10px] font-bold text-purple-500 w-8 mt-0.5">분석</span>
                        <p className="text-xs text-gray-600 flex-1">{log.analysisText}</p>
                      </div>
                    )}
                  </div>
               </div>
             ))}
          </div>
        )}

      </main>

      {/* Navigation Bar */}
      <nav className="bg-white border-t flex justify-around items-center pb-safe pt-1">
        <NavButton icon={BarChart2} label="대시보드" viewName="dashboard" />
        <NavButton icon={CalendarDays} label="계획하기" viewName="planning" />
        <NavButton icon={PlusCircle} label="기록하기" viewName="entry" />
        <NavButton icon={List} label="로그 목록" viewName="list" />
      </nav>

      <style>{`
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default RunningLogApp;