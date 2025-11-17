import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckSquare, Settings, Plus, X, Trash2, Menu, Download, Upload, User, MoreVertical, Edit, CheckCircle2, RotateCcw, Palette, Dumbbell, Heart, Search, LogOut } from 'lucide-react';
import { supabase, TABLES } from './lib/supabase';
import { fetchHolidays, convertSolarToLunar } from './lib/api';

// ============================================
// 🎨 메인 컴포넌트
// ============================================
const PlannerApp = () => {
  
  // ============================================
  // 📊 STATE 관리 - 인증 (Supabase)
  // ============================================
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(true);
  
  // ============================================
  // 📊 STATE 관리 - UI 상태
  // ============================================
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('calendar');
  const [todoSubTab, setTodoSubTab] = useState('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [exerciseHomeOpen, setExerciseHomeOpen] = useState(false);
  const [anniversaryModalOpen, setAnniversaryModalOpen] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [exerciseAddModalOpen, setExerciseAddModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [dayDetailModalOpen, setDayDetailModalOpen] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [selectedDayDate, setSelectedDayDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  
  // ============================================
  // 📊 STATE 관리 - 데이터
  // ============================================
  const [events, setEvents] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [todos, setTodos] = useState([]);
  const [completedTodos, setCompletedTodos] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [anniversaries, setAnniversaries] = useState({
    ddays: [],
    couple: null,
    birthdays: []
  });
  const [categories, setCategories] = useState({
    work: { name: '업무', hexColor: '#3b82f6' },
    personal: { name: '개인', hexColor: '#10b981' },
    health: { name: '건강', hexColor: '#ef4444' },
    study: { name: '공부', hexColor: '#8b5cf6' },
    hobby: { name: '취미', hexColor: '#f59e0b' },
    etc: { name: '기타', hexColor: '#6b7280' }
  });
  const [holidays, setHolidays] = useState({});
  const [lunarDates, setLunarDates] = useState({});
  
  // ============================================
  // 📊 STATE 관리 - 폼 데이터
  // ============================================
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');
  const [anniversaryType, setAnniversaryType] = useState('dday');
  const [anniversaryForm, setAnniversaryForm] = useState({
    name: '',
    date: '',
    lunar: false
  });
  const [coupleForm, setCoupleForm] = useState({
    startDate: '',
    cycles: []
  });
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    sets: '',
    reps: '',
    description: '',
    weekDays: []
  });
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    description: '',
    frequency: 'daily',
    priority: 'medium',
    category: 'work',
    weekDays: [],
    monthOption: 'date',
    monthDate: 1,
    yearMonth: 1
  });
  
  // ============================================
  // 🎨 상수 - 색상 옵션
  // ============================================
  const colorOptions = [
    '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b',
    '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#f97316',
    '#14b8a6', '#a855f7', '#f43f5e', '#22c55e', '#eab308'
  ];
  
  // ============================================
  // 🎨 상수 - 기념일 색상 정의
  // ============================================
  const ANNIVERSARY_COLORS = {
    dday: '#f59e0b',
    birthday: '#ec4899',
    couple: '#ef4444'
  };
  
  // ============================================
  // 🔐 인증 체크 (Supabase)
  // ============================================
  useEffect(() => {
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadUserData();
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    if (session?.user) {
      await loadUserData();
    }
    setLoading(false);
  };
  
  // ============================================
  // 🔐 로그인 (Supabase)
  // ============================================
  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: authForm.email,
        password: authForm.password
      });
      if (error) throw error;
      alert('로그인 성공!');
      setAuthForm({ email: '', password: '' });
    } catch (error) {
      alert('로그인 실패: ' + error.message);
    }
  };
  
  // ============================================
  // 🔐 회원가입 (Supabase)
  // ============================================
  const handleSignup = async () => {
    try {
      const { error } = await supabase.auth.signUp({
        email: authForm.email,
        password: authForm.password
      });
      if (error) throw error;
      alert('회원가입 성공! 이메일을 확인해주세요.');
      setAuthMode('login');
    } catch (error) {
      alert('회원가입 실패: ' + error.message);
    }
  };
  
  // ============================================
  // 🔐 로그아웃 (Supabase)
  // ============================================
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setEvents([]);
    setRoutines([]);
    setTodos([]);
    setCompletedTodos([]);
    setExercises([]);
    setAnniversaries({ ddays: [], couple: null, birthdays: [] });
  };
  
  // ============================================
  // 💾 데이터 로드 (localStorage)
  // ============================================
  useEffect(() => {
    if (!user) return;
    
    const savedData = localStorage.getItem(`plannerData_${user.id}`);
    if (savedData) {
      const data = JSON.parse(savedData);
      if (data.events) setEvents(data.events);
      if (data.routines) setRoutines(data.routines);
      if (data.todos) setTodos(data.todos);
      if (data.completedTodos) setCompletedTodos(data.completedTodos);
      if (data.categories) setCategories(data.categories);
      if (data.exercises) setExercises(data.exercises);
      if (data.anniversaries) setAnniversaries(data.anniversaries);
    }
  }, [user]);
  
  // ============================================
  // 💾 데이터 저장 (localStorage)
  // ============================================
  useEffect(() => {
    if (!user) return;
    
    const data = { events, routines, todos, completedTodos, categories, exercises, anniversaries };
    localStorage.setItem(`plannerData_${user.id}`, JSON.stringify(data));
  }, [events, routines, todos, completedTodos, categories, exercises, anniversaries, user]);
  
  // ============================================
  // 💾 Supabase 데이터 불러오기 (선택사항)
  // ============================================
  const loadUserData = async () => {
    // 현재는 localStorage 사용, 나중에 Supabase로 전환 가능
  };
  
  // ============================================
// 🎯 공휴일 & 음력 데이터 로드
// ============================================
useEffect(() => {
  const loadMonthData = async () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    // 공휴일 로드
    try {
      const holidayData = await fetchHolidays(year);
      setHolidays(holidayData);
    } catch (error) {
      console.error('공휴일 로드 실패:', error);
    }
    
    // 음력 데이터 로드 (해당 월의 모든 날짜)
    const lastDay = new Date(year, month + 1, 0).getDate();
    const lunarData = {};
    
    // 음력 데이터를 병렬로 로드 (더 빠름)
    const lunarPromises = [];
    for (let day = 1; day <= lastDay; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDate(date);
      lunarPromises.push(
        convertSolarToLunar(dateStr)
          .then(lunar => {
            if (lunar) lunarData[dateStr] = lunar;
          })
          .catch(err => console.error(`음력 변환 실패 (${dateStr}):`, err))
      );
    }
    
    // 모든 음력 데이터 로드 완료까지 대기
    await Promise.all(lunarPromises);
    setLunarDates(lunarData);
  };
  
  loadMonthData();
}, [selectedDate]);
  // ============================================
  // 🔄 루틴 → 할일 자동 변환
  // ============================================
  useEffect(() => {
    if (!user) return;
    generateTodosFromRoutines();
  }, [routines, exercises, user]);
  
  // ============================================
  // 🔧 핵심 기능 - 루틴 → 할일 자동 생성
  // ============================================
  const generateTodosFromRoutines = () => {
    const today = new Date();
    const todayStr = formatDate(today);
    const dayOfWeek = today.getDay();
    const dateOfMonth = today.getDate();
    const monthOfYear = today.getMonth() + 1;
    
    const todayRoutines = routines.filter(routine => {
      if (routine.frequency === 'daily') return true;
      if (routine.frequency === 'weekly' && routine.weekDays?.includes(dayOfWeek)) return true;
      if (routine.frequency === 'monthly') {
        if (routine.monthOption === 'lastDay') {
          const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
          return dateOfMonth === lastDay;
        }
        return dateOfMonth === routine.monthDate;
      }
      if (routine.frequency === 'yearly') return monthOfYear === routine.yearMonth;
      return false;
    });
    
    const todayExercises = exercises.filter(ex => ex.weekDays?.includes(dayOfWeek));
    
    const existingRoutineTodos = todos.filter(t => t.isFromRoutine && t.date === todayStr);
    const existingRoutineIds = existingRoutineTodos.map(t => t.sourceRoutineId);
    
    const newTodos = [];
    
    todayRoutines.forEach(routine => {
      if (!existingRoutineIds.includes(routine.id)) {
        newTodos.push({
          id: Date.now() + Math.random(),
          title: routine.title,
          date: todayStr,
          time: routine.time || '',
          description: routine.description || '',
          priority: routine.priority || 'medium',
          category: routine.category,
          completed: false,
          isFromRoutine: true,
          sourceRoutineId: routine.id,
          createdAt: new Date().toISOString()
        });
      }
    });
    
    todayExercises.forEach(exercise => {
      const exerciseRoutineId = `exercise_${exercise.id}`;
      if (!existingRoutineIds.includes(exerciseRoutineId)) {
        newTodos.push({
          id: Date.now() + Math.random(),
          title: `${exercise.name}`,
          date: todayStr,
          time: '',
          description: `${exercise.sets}세트 x ${exercise.reps}회`,
          priority: 'medium',
          category: 'health',
          completed: false,
          isFromRoutine: true,
          sourceRoutineId: exerciseRoutineId,
          createdAt: new Date().toISOString()
        });
      }
    });
    
    if (newTodos.length > 0) {
      setTodos(prev => [...prev, ...newTodos]);
    }
  };
  
  // ============================================
  // 🔧 유틸 함수
  // ============================================
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
const getLunarDate = (date) => {
  const dateStr = formatDate(date);
  return lunarDates[dateStr] || '';
};
  
  // ============================================
  // 🔧 기념일 계산 - 커플 기념일
  // ============================================
  const calculateCoupleDates = () => {
  if (!anniversaries.couple || !anniversaries.couple.startDate) return {};
  const dates = {};
  const [year, month, day] = anniversaries.couple.startDate.split('-');
  const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const cycles = anniversaries.couple.cycles || [];
    
    if (cycles.includes(100)) {
      for (let i = 1; i <= 50; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + (i * 100));
        const key = formatDate(d);
        if (!dates[key]) dates[key] = [];
        dates[key].push({ text: `❤️ ${i * 100}일`, type: 'couple' });
      }
    }
    
    if (cycles.includes(500)) {
      for (let i = 1; i <= 20; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + (i * 500));
        const key = formatDate(d);
        if (!dates[key]) dates[key] = [];
        dates[key].push({ text: `❤️ ${i * 500}일`, type: 'couple' });
      }
    }
    
    if (cycles.includes(1000)) {
      for (let i = 1; i <= 10; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + (i * 1000));
        const key = formatDate(d);
        if (!dates[key]) dates[key] = [];
        dates[key].push({ text: `❤️ ${i * 1000}일`, type: 'couple' });
      }
    }
    
    if (cycles.includes('yearly')) {
      for (let i = 1; i <= 50; i++) {
        const d = new Date(startDate);
        d.setFullYear(d.getFullYear() + i);
        const key = formatDate(d);
        if (!dates[key]) dates[key] = [];
        dates[key].push({ text: `❤️ ${i}주년`, type: 'couple' });
      }
    }
    
    return dates;
  };
  
  // ============================================
  // 🔧 기념일 계산 - D-Day 카운트다운
  // ============================================
  const getDdayCountdown = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return anniversaries.ddays
      .filter(d => {
        const dDate = new Date(d.date);
        dDate.setHours(0, 0, 0, 0);
        return dDate >= today;
      })
      .map(d => {
        const dDate = new Date(d.date);
        dDate.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((dDate - today) / (1000 * 60 * 60 * 24));
        return { ...d, daysLeft };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  };
  
  // ============================================
  // 🔧 캘린더 함수들
  // ============================================
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    
    return days;
  };
  
  const getAllDatesInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const dates = [];
    for (let i = 1; i <= lastDay; i++) dates.push(new Date(year, month, i));
    return dates;
  };
  
  const getEventsForDate = (date) => {
    if (!date) return [];
    const dateStr = formatDate(date);
    
    const regularEvents = events.filter(e => e.date === dateStr);
    
    const ddayEvents = anniversaries.ddays
      .filter(d => d.date === dateStr)
      .map(d => ({
        id: `dday_${d.id}`,
        title: `📌 ${d.name}`,
        date: d.date,
        category: 'etc',
        isAnniversary: true,
        anniversaryType: 'dday'
      }));
    
    const birthdayEvents = anniversaries.birthdays
      .filter(b => {
        const bDate = new Date(b.date);
        return bDate.getMonth() === date.getMonth() && bDate.getDate() === date.getDate();
      })
      .map(b => ({
        id: `birthday_${b.id}`,
        title: `🎂 ${b.name}`,
        date: dateStr,
        category: 'etc',
        isAnniversary: true,
        anniversaryType: 'birthday'
      }));
    
    const coupleDates = calculateCoupleDates();
    const coupleEvents = (coupleDates[dateStr] || []).map((evt, idx) => ({
      id: `couple_${dateStr}_${idx}`,
      title: evt.text,
      date: dateStr,
      category: 'etc',
      isAnniversary: true,
      anniversaryType: 'couple'
    }));
    
    return [...regularEvents, ...ddayEvents, ...birthdayEvents, ...coupleEvents];
  };
  
  const getAnniversaryColor = (anniversaryType) => {
    return ANNIVERSARY_COLORS[anniversaryType] || '#6b7280';
  };
  
  const handleDayClick = (day) => {
    setSelectedDate(day);
    const dayEvents = getEventsForDate(day);
    setSelectedDayEvents(dayEvents);
    setSelectedDayDate(day);
    setDayDetailModalOpen(true);
  };
  // ============================================
  // 🔧 카테고리 함수들
  // ============================================
  const addCategory = () => {
    if (!newCategoryName.trim()) {
      alert('카테고리 이름을 입력해주세요');
      return;
    }
    const categoryKey = `cat_${Date.now()}`;
    setCategories({ ...categories, [categoryKey]: { name: newCategoryName, hexColor: newCategoryColor } });
    setNewCategoryName('');
    setNewCategoryColor('#3b82f6');
  };
  
  const deleteCategory = (key) => {
    if (Object.keys(categories).length <= 1) {
      alert('최소 1개의 카테고리는 필요합니다');
      return;
    }
    const newCategories = { ...categories };
    delete newCategories[key];
    setCategories(newCategories);
  };
  
  // ============================================
  // 🔧 운동 함수들
  // ============================================
  const addExercise = () => {
    if (!exerciseForm.name.trim()) {
      alert('운동명을 입력해주세요');
      return;
    }
    if (exerciseForm.weekDays.length === 0) {
      alert('요일을 선택해주세요');
      return;
    }
    const newExercise = { id: Date.now(), ...exerciseForm, records: [] };
    setExercises([...exercises, newExercise]);
    setExerciseForm({ name: '', sets: '', reps: '', description: '', weekDays: [] });
    setExerciseAddModalOpen(false);
  };
  
  // ============================================
  // 🔧 기념일 함수들
  // ============================================
  const addAnniversary = () => {
    if (anniversaryType === 'dday') {
      if (!anniversaryForm.name || !anniversaryForm.date) {
        alert('이름과 날짜를 입력해주세요');
        return;
      }
      setAnniversaries({ ...anniversaries, ddays: [...anniversaries.ddays, { id: Date.now(), ...anniversaryForm }] });
    } else if (anniversaryType === 'couple') {
      if (!coupleForm.startDate || coupleForm.cycles.length === 0) {
        alert('사귄 날짜와 표시 주기를 선택해주세요');
        return;
      }
      setAnniversaries({ ...anniversaries, couple: coupleForm });
    } else if (anniversaryType === 'birthday') {
      if (!anniversaryForm.name || !anniversaryForm.date) {
        alert('이름과 날짜를 입력해주세요');
        return;
      }
      setAnniversaries({ ...anniversaries, birthdays: [...anniversaries.birthdays, { id: Date.now(), ...anniversaryForm }] });
    }
    setAnniversaryForm({ name: '', date: '', lunar: false });
    setCoupleForm({ startDate: '', cycles: [] });
  };
  
  const deleteAnniversary = (type, id) => {
    if (type === 'dday') {
      setAnniversaries({ ...anniversaries, ddays: anniversaries.ddays.filter(d => d.id !== id) });
    } else if (type === 'couple') {
      setAnniversaries({ ...anniversaries, couple: null });
    } else if (type === 'birthday') {
      setAnniversaries({ ...anniversaries, birthdays: anniversaries.birthdays.filter(b => b.id !== id) });
    }
  };
  
  // ============================================
  // 🔧 모달 함수들
  // ============================================
  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setModalOpen(true);
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        title: '',
        date: formatDate(selectedDate),
        time: '',
        description: '',
        frequency: 'daily',
        priority: 'medium',
        category: Object.keys(categories)[0] || 'work',
        weekDays: [],
        monthOption: 'date',
        monthDate: 1,
        yearMonth: 1
      });
    }
  };
  
  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };
  
  const handleSubmit = () => {
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요');
      return;
    }
    if (modalType === 'event' && !formData.date) {
      alert('날짜를 선택해주세요');
      return;
    }
    if (modalType === 'routine' && formData.frequency === 'weekly' && formData.weekDays.length === 0) {
      alert('요일을 선택해주세요');
      return;
    }
    
    if (editingItem) {
      if (modalType === 'event') {
        setEvents(events.map(e => e.id === editingItem.id ? { ...formData, id: editingItem.id } : e));
      } else if (modalType === 'routine') {
        setRoutines(routines.map(r => r.id === editingItem.id ? { ...formData, id: editingItem.id } : r));
      } else if (modalType === 'todo') {
        setTodos(todos.map(t => t.id === editingItem.id ? { ...formData, id: editingItem.id } : t));
      }
    } else {
      const newItem = { id: Date.now(), ...formData, completed: false, createdAt: new Date().toISOString() };
      if (modalType === 'event') {
        setEvents([...events, newItem]);
      } else if (modalType === 'routine') {
        setRoutines([...routines, newItem]);
      } else if (modalType === 'todo') {
        setTodos([...todos, newItem]);
      }
    }
    closeModal();
  };
  
  // ============================================
  // 🔧 할일 함수들
  // ============================================
  const toggleComplete = (id) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      setCompletedTodos([...completedTodos, { ...todo, completedAt: new Date().toISOString() }]);
      setTodos(todos.filter(t => t.id !== id));
    }
  };
  
  const restoreTodo = (id) => {
    const todo = completedTodos.find(t => t.id === id);
    if (todo) {
      const { completedAt, ...restoreTodo } = todo;
      setTodos([...todos, restoreTodo]);
      setCompletedTodos(completedTodos.filter(t => t.id !== id));
    }
  };
  
  const deleteItem = (type, id) => {
    if (type === 'event') setEvents(events.filter(e => e.id !== id));
    else if (type === 'routine') setRoutines(routines.filter(r => r.id !== id));
    else if (type === 'todo') setTodos(todos.filter(t => t.id !== id));
    else if (type === 'completed') setCompletedTodos(completedTodos.filter(t => t.id !== id));
    else if (type === 'exercise') setExercises(exercises.filter(e => e.id !== id));
    setOpenMenuId(null);
  };
  
  const sortTodosByPriority = (todoList) => {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    return [...todoList].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  };
  
  const getOverdueTodos = () => {
    const today = formatDate(new Date());
    return sortTodosByPriority(todos.filter(t => t.date && t.date < today));
  };
  
  const getTodayTodos = () => {
    const today = formatDate(new Date());
    return sortTodosByPriority(todos.filter(t => t.date === today));
  };
  
  const getTomorrowTodos = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return sortTodosByPriority(todos.filter(t => t.date === formatDate(tomorrow)));
  };
  
  const getUpcomingTodos = () => {
    const today = formatDate(new Date());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDate(tomorrow);
    return sortTodosByPriority(todos.filter(t => t.date && t.date > tomorrowStr));
  };
  
  const getNoDateTodos = () => sortTodosByPriority(todos.filter(t => !t.date || t.date === ''));
  
  const groupTodosByDate = (todos) => {
    const grouped = {};
    todos.forEach(todo => {
      if (!grouped[todo.date]) grouped[todo.date] = [];
      grouped[todo.date].push(todo);
    });
    return grouped;
  };
  
  // ============================================
  // 🔧 루틴 함수들
  // ============================================
  const getTodayRoutines = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dateOfMonth = today.getDate();
    const monthOfYear = today.getMonth() + 1;
    
    const regularRoutines = routines.filter(routine => {
      if (routine.frequency === 'daily') return true;
      if (routine.frequency === 'weekly' && routine.weekDays?.includes(dayOfWeek)) return true;
      if (routine.frequency === 'monthly') {
        if (routine.monthOption === 'lastDay') {
          const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
          return dateOfMonth === lastDay;
        }
        return dateOfMonth === routine.monthDate;
      }
      if (routine.frequency === 'yearly') return monthOfYear === routine.yearMonth;
      return false;
    });
    
    const exerciseRoutines = exercises.filter(ex => ex.weekDays?.includes(dayOfWeek)).map(ex => ({
      id: `exercise_${ex.id}`,
      title: `🏋️ ${ex.name}`,
      time: '',
      category: 'health',
      description: `${ex.sets}세트 x ${ex.reps}회`,
      isExercise: true
    }));
    
    return [...regularRoutines, ...exerciseRoutines];
  };
  
  const getRoutinesByDay = () => {
    const schedule = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    
    routines.filter(r => r.frequency === 'daily' || r.frequency === 'weekly').forEach(routine => {
      if (routine.frequency === 'daily') {
        for (let i = 0; i <= 6; i++) schedule[i].push(routine);
      } else if (routine.frequency === 'weekly' && routine.weekDays) {
        routine.weekDays.forEach(day => schedule[day].push(routine));
      }
    });
    
    for (let dayIndex = 0; dayIndex <= 6; dayIndex++) {
      const dayExercises = exercises.filter(ex => ex.weekDays?.includes(dayIndex));
      if (dayExercises.length > 0) {
        schedule[dayIndex].push({
          id: `exercise_group_${dayIndex}`,
          title: `🏋️ 운동`,
          time: '',
          category: 'health',
          description: dayExercises.map(ex => `${ex.name} ${ex.sets}x${ex.reps}`).join(', '),
          isExerciseGroup: true
        });
      }
    }
    
    return schedule;
  };
  
  const getMonthlyRoutines = () => routines.filter(r => r.frequency === 'monthly');
  const getYearlyRoutines = () => routines.filter(r => r.frequency === 'yearly');
  
  // ============================================
  // 🔧 폼 함수들
  // ============================================
  const toggleWeekDay = (day, isExercise = false) => {
    if (isExercise) {
      if (exerciseForm.weekDays.includes(day)) {
        setExerciseForm({ ...exerciseForm, weekDays: exerciseForm.weekDays.filter(d => d !== day) });
      } else {
        setExerciseForm({ ...exerciseForm, weekDays: [...exerciseForm.weekDays, day] });
      }
    } else {
      if (formData.weekDays.includes(day)) {
        setFormData({ ...formData, weekDays: formData.weekDays.filter(d => d !== day) });
      } else {
        setFormData({ ...formData, weekDays: [...formData.weekDays, day] });
      }
    }
  };
  
  const toggleCoupleCycle = (cycle) => {
    if (coupleForm.cycles.includes(cycle)) {
      setCoupleForm({ ...coupleForm, cycles: coupleForm.cycles.filter(c => c !== cycle) });
    } else {
      setCoupleForm({ ...coupleForm, cycles: [...coupleForm.cycles, cycle] });
    }
  };
  
  // ============================================
  // 🔧 백업 함수들
  // ============================================
  const handleBackup = () => {
    const data = { 
      events, 
      routines, 
      todos, 
      completedTodos, 
      categories, 
      exercises, 
      anniversaries, 
      backupDate: new Date().toISOString() 
    };
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `planner-backup-${formatDate(new Date())}.json`;
    link.click();
  };
  
  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.events) setEvents(data.events);
          if (data.routines) setRoutines(data.routines);
          if (data.todos) setTodos(data.todos);
          if (data.completedTodos) setCompletedTodos(data.completedTodos);
          if (data.categories) setCategories(data.categories);
          if (data.exercises) setExercises(data.exercises);
          if (data.anniversaries) setAnniversaries(data.anniversaries);
          alert('데이터가 복원되었습니다');
        } catch (error) {
          alert('파일을 읽을 수 없습니다');
        }
      };
      reader.readAsText(file);
    }
  };
  
  // ============================================
  // 🔧 관리자 함수
  // ============================================
  const handleAdminLogin = () => {
    if (adminPassword === 'park041101!') {
      setIsAdmin(true);
      setAdminPassword('');
      setAdminModalOpen(false);
      alert('관리자 로그인 성공');
    } else {
      alert('비밀번호가 올바르지 않습니다');
      setAdminPassword('');
    }
  };
  
  // ============================================
  // 🔍 검색 함수
  // ============================================
  const filterBySearch = (items, searchFields) => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => {
      return searchFields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query);
        }
        return false;
      });
    });
  };
  
  // ============================================
  // 🎨 상수 - 한글 표시
  // ============================================
  const days = getDaysInMonth(selectedDate);
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekDaysKor = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const coupleDates = calculateCoupleDates();
  const ddayCountdowns = getDdayCountdown();
  
  // ============================================
  // 🎨 컴포넌트 - 3점 메뉴
  // ============================================
  const ThreeDotsMenu = ({ type, item }) => (
    <div className="relative">
      <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === item.id ? null : item.id); }} className="p-1 hover:bg-gray-100 rounded transition">
        <MoreVertical size={16} className="text-gray-600" />
      </button>
      {openMenuId === item.id && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)}></div>
          <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <button onClick={(e) => { e.stopPropagation(); openModal(type, item); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left">
              <Edit size={14} />수정
            </button>
            <button onClick={(e) => { e.stopPropagation(); if (window.confirm('삭제하시겠습니까?')) { deleteItem(type, item.id); }}} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-red-600 text-left">
              <Trash2 size={14} />삭제
            </button>
          </div>
        </>
      )}
    </div>
  );
  
  // ============================================
  // 🎨 로딩 화면
  // ============================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }
  
  // ============================================
  // 🎨 로그인 화면
  // ============================================
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">📅 RoutineFlow</h1>
          
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 rounded-lg transition ${authMode === 'login' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              로그인
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 rounded-lg transition ${authMode === 'signup' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              회원가입
            </button>
          </div>
          
          <div className="space-y-4">
            <input
              type="email"
              placeholder="이메일"
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && (authMode === 'login' ? handleLogin() : handleSignup())}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={authMode === 'login' ? handleLogin : handleSignup}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              {authMode === 'login' ? '로그인' : '회원가입'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // 🎨 메인 앱 렌더링 시작
  // ============================================
  return (
    <div className="flex h-screen bg-gray-50">
      {/* 사이드바 */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-800">RoutineFlow</h1>
            <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg" title="로그아웃">
              <LogOut size={18} />
            </button>
          </div>
          <nav className="space-y-2">
            {[
              { key: 'calendar', icon: <Calendar size={20} />, label: '캘린더' },
              { key: 'routine', icon: <Clock size={20} />, label: '루틴' },
              { key: 'todo', icon: <CheckSquare size={20} />, label: '할 일' },
              { key: 'settings', icon: <Settings size={20} />, label: '설정' }
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === tab.key ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* 메인 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {activeTab === 'calendar' && '캘린더'}
              {activeTab === 'routine' && '루틴 관리'}
              {activeTab === 'todo' && '할 일 목록'}
              {activeTab === 'settings' && '설정'}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            {activeTab !== 'settings' && (
              <>
                <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <Search size={20} />
                </button>
                
                <div className="relative">
                  <button onClick={() => setHeaderMenuOpen(!headerMenuOpen)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <MoreVertical size={20} />
                  </button>
                  {headerMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setHeaderMenuOpen(false)}></div>
                      <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                        {activeTab === 'calendar' && (
                          <>
                            <button onClick={() => { setCategoryModalOpen(true); setHeaderMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-left">
                              <Palette size={16} />카테고리 관리
                            </button>
                            <button onClick={() => { setAnniversaryModalOpen(true); setHeaderMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-left">
                              <Heart size={16} />기념일 관리
                            </button>
                          </>
                        )}
                        {activeTab === 'routine' && (
                          <button onClick={() => { setExerciseHomeOpen(true); setHeaderMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-left">
                            <Dumbbell size={16} />운동 루틴 관리
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
                
                <button onClick={() => openModal(activeTab === 'calendar' ? 'event' : activeTab)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  <Plus size={18} />
                  <span>
                    {activeTab === 'calendar' && '새 일정'}
                    {activeTab === 'routine' && '새 루틴'}
                    {activeTab === 'todo' && '새 할일'}
                  </span>
                </button>
              </>
            )}
            <span className="text-sm text-gray-600 ml-2">{user.email}</span>
          </div>
        </header>
        
        {/* 검색창 */}
        {searchOpen && activeTab !== 'settings' && (
          <div className="bg-white border-b px-6 py-3">
            <div className="max-w-2xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`${activeTab === 'calendar' ? '일정' : activeTab === 'routine' ? '루틴' : '할일'} 검색...`}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
        
        {/* 메인 컨텐츠 */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* 캘린더 탭 */}
          {activeTab === 'calendar' && (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* 월간 캘린더 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))} className="px-3 py-1 hover:bg-gray-100 rounded">←</button>
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-semibold">{selectedDate.getFullYear()}년 {monthNames[selectedDate.getMonth()]}</h3>
                    {ddayCountdowns.length > 0 && (
                      <div className="flex gap-2">
                        {ddayCountdowns.slice(0, 3).map(d => (
                          <span key={d.id} className="text-sm bg-pink-100 text-pink-700 px-3 py-1 rounded-full">
                            {d.name} D-{d.daysLeft}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))} className="px-3 py-1 hover:bg-gray-100 rounded">→</button>
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map(day => (
                    <div key={day} className="text-center font-semibold text-gray-600 py-2">{day}</div>
                  ))}
                  {days.map((day, index) => {
                    if (!day) return <div key={index} className="bg-gray-50 min-h-32 p-2 border rounded-lg"></div>;
                    
                    const dayEvents = getEventsForDate(day);
                    const isToday = formatDate(day) === formatDate(new Date());
                    const dateStr = formatDate(day);
                    const holiday = holidays[dateStr];
                    const lunarDate = getLunarDate(day);
                    
                    return (
                      <div key={index} onClick={() => handleDayClick(day)} className={`min-h-32 p-2 border rounded-lg cursor-pointer transition hover:bg-gray-50 bg-white ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
                        <div className="flex items-start justify-between mb-1">
                          <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : holiday ? 'text-red-600' : 'text-gray-700'}`}>
                            {day.getDate()}
                          </div>
                        </div>
                        {holiday && <div className="text-xs text-red-600 truncate mb-1">{holiday}</div>}
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map(event => {
                            const eventColor = event.isAnniversary 
                              ? getAnniversaryColor(event.anniversaryType)
                              : categories[event.category]?.hexColor || '#6b7280';
                            
                            return (
                              <div key={event.id} className="text-xs border px-2 py-1 rounded truncate" style={{ borderColor: eventColor, color: eventColor }}>
                                {event.title}
                              </div>
                            );
                          })}
                          {dayEvents.length > 2 && <div className="text-xs text-gray-500">+{dayEvents.length - 2}개</div>}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">{lunarDate}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* 일정 목록 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h4 className="font-semibold mb-4 text-lg">{selectedDate.getFullYear()}년 {monthNames[selectedDate.getMonth()]} 일정 목록</h4>
                <div className="space-y-3">
                  {filterBySearch(getAllDatesInMonth(selectedDate), []).map(date => {
                    const dateStr = formatDate(date);
                    const dayEvents = getEventsForDate(date);
                    const filteredEvents = filterBySearch(dayEvents, ['title', 'description']);
                    const isToday = dateStr === formatDate(new Date());
                    
                    if (searchQuery && filteredEvents.length === 0) return null;
                    
                    return (
                      <div key={dateStr} className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition ${isToday ? 'border-blue-500' : 'border-gray-200'}`} onClick={() => handleDayClick(date)}>
                        <div className={`font-medium mb-2 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                          {date.getMonth() + 1}월 {date.getDate()}일 ({weekDays[date.getDay()]})
                          {isToday && <span className="ml-2 text-sm bg-blue-600 text-white px-2 py-0.5 rounded">오늘</span>}
                        </div>
                        {filteredEvents.length === 0 ? (
                          <p className="text-sm text-gray-500">일정이 없습니다</p>
                        ) : (
                          <div className="flex gap-2 flex-wrap">
                            {filteredEvents.slice(0, 3).map(event => {
                              const eventColor = event.isAnniversary 
                                ? getAnniversaryColor(event.anniversaryType)
                                : categories[event.category]?.hexColor || '#6b7280';
                              
                              return (
                                <span key={event.id} className="text-xs px-2 py-1 rounded border" style={{ borderColor: eventColor, color: eventColor }}>
                                  {event.title}
                                </span>
                              );
                            })}
                            {filteredEvents.length > 3 && <span className="text-xs text-gray-500">+{filteredEvents.length - 3}개 더</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 루틴 탭 */}
          {activeTab === 'routine' && (
            <div className="max-w-6xl mx-auto space-y-8">
              {/* 오늘의 루틴 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">오늘의 루틴 ({formatDate(new Date())})</h3>
                {(() => {
                  const todayRoutines = getTodayRoutines();
                  const filteredRoutines = filterBySearch(todayRoutines, ['title', 'description']);
                  
                  return filteredRoutines.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">
                      {searchQuery ? '검색 결과가 없습니다' : '오늘 예정된 루틴이 없습니다'}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredRoutines.map(routine => (
                        <div key={routine.id} className="p-4 rounded-lg border-l-4 border border-gray-200" style={{ borderLeftColor: categories[routine.category]?.hexColor || '#6b7280' }}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium mb-1" style={{ color: categories[routine.category]?.hexColor || '#6b7280' }}>
                                {routine.title}
                              </div>
                              {routine.time && <div className="text-sm text-gray-600">⏰ {routine.time}</div>}
                              {routine.description && <div className="text-xs text-gray-500 mt-1">{routine.description}</div>}
                            </div>
                            {!routine.isExercise && <ThreeDotsMenu type="routine" item={routine} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
              
              {/* 주간 루틴 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-6">주간 루틴</h3>
                <div className="grid grid-cols-7 gap-3">
                  {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
                    const dayRoutines = getRoutinesByDay()[dayIndex];
                    const isToday = dayIndex === new Date().getDay();
                    
                    return (
                      <div key={dayIndex} className={`border-2 rounded-lg p-3 ${isToday ? 'border-blue-500' : 'border-gray-200'}`}>
                        <div className={`text-center font-semibold mb-3 pb-2 border-b ${isToday ? 'text-blue-600 border-blue-200' : 'text-gray-700 border-gray-200'}`}>
                          {weekDaysKor[dayIndex].slice(0, 1)}
                          {isToday && <div className="text-xs text-blue-500 mt-1">오늘</div>}
                        </div>
                        <div className="space-y-2">
                          {dayRoutines.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">-</p>
                          ) : (
                            dayRoutines.map(routine => (
                              <div key={routine.id} className="p-2 rounded border-l-3 border border-gray-200" style={{ borderLeftColor: categories[routine.category]?.hexColor || '#6b7280' }}>
                                <div className="text-xs font-medium truncate" style={{ color: categories[routine.category]?.hexColor || '#6b7280' }}>
                                  {routine.title}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* 월간/연간 루틴 생략 - 파일이 너무 길어서 */}
            </div>
          )}
{/* 할일 탭 */}
          {activeTab === 'todo' && (
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2 mb-6">
                <button onClick={() => setTodoSubTab('active')} className={`px-4 py-2 rounded-lg transition ${todoSubTab === 'active' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>
                  진행 중
                </button>
                <button onClick={() => setTodoSubTab('completed')} className={`px-4 py-2 rounded-lg transition ${todoSubTab === 'completed' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>
                  완료 ({completedTodos.length})
                </button>
              </div>
              
              {todoSubTab === 'active' ? (
                <div className="space-y-6">
                  {/* 오늘 할일 */}
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden border-2 border-blue-500">
                    <div className="border-b border-blue-200 px-6 py-4">
                      <h3 className="font-semibold text-blue-600">오늘</h3>
                    </div>
                    <div className="p-4 space-y-2">
                      {(() => {
                        const todayTodos = getTodayTodos();
                        const filteredTodos = filterBySearch(todayTodos, ['title', 'description']);
                        return filteredTodos.length === 0 ? (
                          <p className="text-center py-6 text-gray-400">
                            {searchQuery ? '검색 결과가 없습니다' : '오늘 할 일이 없습니다'}
                          </p>
                        ) : (
                          filteredTodos.map(todo => (
                            <div key={todo.id} className="flex items-center gap-3 p-3 rounded-lg border">
                              <input type="checkbox" onChange={() => toggleComplete(todo.id)} className="w-5 h-5" />
                              <div className="flex-1">
                                <div className="font-medium flex items-center gap-2">
                                  {todo.isFromRoutine && <span className="text-blue-600">🔁</span>}
                                  {todo.title}
                                </div>
                                {todo.description && <div className="text-xs text-gray-500">{todo.description}</div>}
                              </div>
                              <div className="flex items-center gap-2">
                                {todo.priority === 'high' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                                {todo.priority === 'medium' && <span className="w-2 h-2 rounded-full bg-yellow-500"></span>}
                                {todo.priority === 'low' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                                <ThreeDotsMenu type="todo" item={todo} />
                              </div>
                            </div>
                          ))
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold mb-4">완료된 할 일</h3>
                  {completedTodos.length === 0 ? (
                    <p className="text-center py-8 text-gray-400">완료된 할 일이 없습니다</p>
                  ) : (
                    <div className="space-y-2">
                      {completedTodos.map(todo => (
                        <div key={todo.id} className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
                          <CheckCircle2 size={20} className="text-green-600" />
                          <div className="flex-1">
                            <div className="font-medium line-through text-gray-500">{todo.title}</div>
                          </div>
                          <button onClick={() => restoreTodo(todo.id)} className="p-1 hover:bg-gray-200 rounded">
                            <RotateCcw size={16} />
                          </button>
                          <button onClick={() => deleteItem('completed', todo.id)} className="p-1 hover:bg-red-100 rounded text-red-600">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* 설정 탭 */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">계정 정보</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                  <button onClick={handleLogout} className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition">
                    로그아웃
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">데이터 관리</h3>
                <div className="space-y-3">
                  <button onClick={handleBackup} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                    <Download size={18} />
                    데이터 백업
                  </button>
                  <label className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition cursor-pointer">
                    <Upload size={18} />
                    데이터 복원
                    <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* 일정/루틴/할일 추가 모달 */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingItem ? '수정' : '새로 만들기'}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="제목"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              {modalType !== 'routine' && (
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
              
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <textarea
                placeholder="설명"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
              />
              
              {modalType === 'routine' && (
                <div>
                  <label className="block text-sm font-medium mb-2">반복 주기</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">매일</option>
                    <option value="weekly">매주</option>
                    <option value="monthly">매월</option>
                    <option value="yearly">매년</option>
                  </select>
                  
                  {formData.frequency === 'weekly' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium mb-2">요일 선택</label>
                      <div className="flex gap-2">
                        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                          <button
                            key={index}
                            onClick={() => toggleWeekDay(index)}
                            className={`px-3 py-2 rounded ${formData.weekDays.includes(index) ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {modalType === 'todo' && (
                <div>
                  <label className="block text-sm font-medium mb-2">우선순위</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="high">높음</option>
                    <option value="medium">보통</option>
                    <option value="low">낮음</option>
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-2">카테고리</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(categories).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <button onClick={handleSubmit} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                {editingItem ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 카테고리 관리 모달 */}
      {categoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">카테고리 관리</h3>
              <button onClick={() => setCategoryModalOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="카테고리 이름"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: newCategoryColor, color: 'white' }}
                >
                  {colorOptions.map(color => (
                    <option key={color} value={color} style={{ backgroundColor: color }}>
                      {color}
                    </option>
                  ))}
                </select>
                <button onClick={addCategory} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  추가
                </button>
              </div>
              
              <div className="space-y-2">
                {Object.entries(categories).map(([key, cat]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: cat.hexColor }}></div>
                      <span>{cat.name}</span>
                    </div>
                    <button onClick={() => deleteCategory(key)} className="text-red-600 hover:bg-red-50 p-2 rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 기념일 관리 모달 */}
      {anniversaryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">기념일 관리</h3>
              <button onClick={() => setAnniversaryModalOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-2 mb-4">
                <button onClick={() => setAnniversaryType('dday')} className={`px-4 py-2 rounded-lg ${anniversaryType === 'dday' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                  D-Day
                </button>
                <button onClick={() => setAnniversaryType('couple')} className={`px-4 py-2 rounded-lg ${anniversaryType === 'couple' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                  커플 기념일
                </button>
                <button onClick={() => setAnniversaryType('birthday')} className={`px-4 py-2 rounded-lg ${anniversaryType === 'birthday' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                  생일
                </button>
              </div>
              
              {anniversaryType === 'dday' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="D-Day 이름"
                    value={anniversaryForm.name}
                    onChange={(e) => setAnniversaryForm({ ...anniversaryForm, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={anniversaryForm.date}
                    onChange={(e) => setAnniversaryForm({ ...anniversaryForm, date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={addAnniversary} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                    추가
                  </button>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">등록된 D-Day</h4>
                    {anniversaries.ddays.map(d => (
                      <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <span>{d.name} - {d.date}</span>
                        <button onClick={() => deleteAnniversary('dday', d.id)} className="text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {anniversaryType === 'couple' && (
                <div className="space-y-4">
                  <input
                    type="date"
                    value={coupleForm.startDate}
                    onChange={(e) => setCoupleForm({ ...coupleForm, startDate: e.target.value })}
                    placeholder="사귄 날짜"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <label className="block text-sm font-medium mb-2">표시 주기</label>
                    <div className="flex gap-2 flex-wrap">
                      {[100, 500, 1000, 'yearly'].map(cycle => (
                        <button
                          key={cycle}
                          onClick={() => toggleCoupleCycle(cycle)}
                          className={`px-4 py-2 rounded-lg ${coupleForm.cycles.includes(cycle) ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                        >
                          {cycle === 'yearly' ? '매년' : `${cycle}일`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={addAnniversary} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                    저장
                  </button>
                  
                  {anniversaries.couple && (
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <span>시작일: {anniversaries.couple.startDate}</span>
                        <button onClick={() => deleteAnniversary('couple', null)} className="text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {anniversaryType === 'birthday' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="이름"
                    value={anniversaryForm.name}
                    onChange={(e) => setAnniversaryForm({ ...anniversaryForm, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={anniversaryForm.date}
                    onChange={(e) => setAnniversaryForm({ ...anniversaryForm, date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={addAnniversary} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                    추가
                  </button>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">등록된 생일</h4>
                    {anniversaries.birthdays.map(b => (
                      <div key={b.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <span>{b.name} - {b.date}</span>
                        <button onClick={() => deleteAnniversary('birthday', b.id)} className="text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 운동 루틴 관리 모달 */}
      {exerciseHomeOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">운동 루틴 관리</h3>
              <button onClick={() => setExerciseHomeOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            
            <button onClick={() => setExerciseAddModalOpen(true)} className="w-full mb-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              <Plus size={18} className="inline mr-2" />
              새 운동 추가
            </button>
            
            <div className="space-y-2">
              {exercises.map(ex => (
                <div key={ex.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{ex.name}</div>
                    <div className="text-sm text-gray-600">{ex.sets}세트 x {ex.reps}회</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {ex.weekDays.map(d => weekDaysKor[d].slice(0, 1)).join(', ')}
                    </div>
                  </div>
                  <button onClick={() => deleteItem('exercise', ex.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* 운동 추가 모달 */}
      {exerciseAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">새 운동 추가</h3>
              <button onClick={() => setExerciseAddModalOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="운동명"
                value={exerciseForm.name}
                onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="세트"
                  value={exerciseForm.sets}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, sets: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="횟수"
                  value={exerciseForm.reps}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, reps: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">요일 선택</label>
                <div className="flex gap-2">
                  {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                    <button
                      key={index}
                      onClick={() => toggleWeekDay(index, true)}
                      className={`px-3 py-2 rounded ${exerciseForm.weekDays.includes(index) ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={addExercise} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                추가
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 날짜 상세 모달 */}
      {dayDetailModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {selectedDayDate && `${selectedDayDate.getMonth() + 1}월 ${selectedDayDate.getDate()}일`}
              </h3>
              <button onClick={() => setDayDetailModalOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3">
              {selectedDayEvents.length === 0 ? (
                <p className="text-center py-8 text-gray-400">일정이 없습니다</p>
              ) : (
                selectedDayEvents.map(event => {
                  const eventColor = event.isAnniversary 
                    ? getAnniversaryColor(event.anniversaryType)
                    : categories[event.category]?.hexColor || '#6b7280';
                  
                  return (
                    <div key={event.id} className="p-4 border-l-4 border rounded-lg" style={{ borderLeftColor: eventColor }}>
                      <div className="font-medium" style={{ color: eventColor }}>
                        {event.title}
                      </div>
                      {event.description && (
                        <div className="text-sm text-gray-600 mt-1">{event.description}</div>
                      )}
                      {event.time && (
                        <div className="text-xs text-gray-500 mt-1">⏰ {event.time}</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlannerApp;
