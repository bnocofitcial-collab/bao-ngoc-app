import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Clock, ChevronLeft, ChevronRight, XCircle, Volume2, 
  RefreshCcw, Grip, Target, Award, Zap, Star, Info,
  CheckCircle, AlertCircle, Bot, BrainCircuit, Loader2,
  ZoomIn, ZoomOut, Type, Headphones, PlayCircle, Radio,
  Download, Plus, Trash2, Edit, Save, BookOpen, Bookmark, BookmarkCheck,
  FastForward, Repeat, PauseCircle, Play, Sparkles, Moon, Sun, 
  Settings, ChevronDown, Share2, Layers, Cpu, Globe
} from 'lucide-react';

// ==========================================
// FIREBASE IMPORTS (MANDATORY RULES APPLIED)
// ==========================================
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

// ==========================================
// ENVIRONMENT VARIABLES & CONFIG
// ==========================================
const apiKey = ""; // Injected by execution environment for Gemini
const appId = typeof __app_id !== 'undefined' ? __app_id : 'exam-factory-pro-app';
const firebaseConfigStr = typeof __firebase_config !== 'undefined' ? __firebase_config : null;

let app, auth, db;
if (firebaseConfigStr) {
  try {
    const firebaseConfig = JSON.parse(firebaseConfigStr);
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase init failed", e);
  }
}

// ==========================================
// GEMINI API HELPER (PRO UPGRADED)
// ==========================================
const fetchGeminiAPI = async (prompt, systemInstruction = null, isJson = false) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const payload = { contents: [{ parts: [{ text: prompt }] }] };
  if (systemInstruction) payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  if (isJson) {
    payload.generationConfig = { responseMimeType: "application/json" };
  }

  const delays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i < delays.length + 1; i++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      return result.candidates[0].content.parts[0].text;
    } catch (error) {
      if (i === delays.length) throw error;
      await new Promise(resolve => setTimeout(resolve, delays[i]));
    }
  }
};

// ==========================================
// DEFAULT DATA (FALLBACK EXAM)
// ==========================================
const defaultPassages = {
  cloze1: `Living in a city has a number of drawbacks. Firstly, there is the problem of traffic jams and traffic accidents. The increase (21) _____ population and the increasing number of vehicles have caused many accidents to happen every day. Secondly, air pollution negatively affects people’s health, and it also has a bad influence (22) _____ the environment. More and more city dwellers suffer from coughing or breathing problems. Thirdly, the city is noisy, even at night. Noise pollution comes from the traffic and from construction sites. Buildings are always being knocked (23) _____ and rebuilt. These factors contribute to making city life (24) _____ difficult for its residents. However, many people still prefer living in the city because of the (25) _____ of job opportunities and modern facilities.`,
  reading1: `The Internet has increasingly developed and become part of our everyday life. Do you find the Internet useful? What do you use the Internet for? For me, the Internet is a very fast and convenient way to get information. I can also communicate with my friends and relatives by means of e-mail or chatting. However, I don't use the Internet very often. For me, the Internet is a wonderful invention of modern life. It makes our world a small village.\n\nIn addition to its benefits, the Internet also has limitations. It is time-consuming and costly. It is also dangerous because of viruses and bad programs. Moreover, Internet users sometimes have to suffer various risks such as spam or electronic junk mail, and personal information leaking. So, while enjoying surfing, be alert!`,
  listen1: `Welcome everyone to the Green Planet Eco Park. My name is Sarah and I'll be your guide today. The park was established in 1995 to protect local wildlife. Right now, we are standing at the main entrance. In a few minutes, we will walk to the Butterfly Glasshouse, which is our most popular attraction. Please remember that feeding the animals is strictly prohibited. If you want to have a picnic, there is a designated area near the Blue Lake. We will finish our tour at the souvenir shop at 4 PM. Enjoy your visit!`,
  listen2: `Tom: Hey Mary, have you finished the science project about renewable energy?\nMary: Hi Tom. Almost! I decided to focus on solar power. I think it's the most practical energy source for our city.\nTom: That's interesting. I chose wind power, but it's hard to find good locations for wind turbines.\nMary: True. By the way, the teacher said we need to present our projects next Monday. Are you ready?\nTom: Next Monday? I thought it was next Friday! I haven't even started making the slides.\nMary: Don't worry, Tom. If you want, we can go to the library this weekend and I'll help you with the presentation.\nTom: You're a lifesaver, Mary! Let's meet on Saturday morning then.`
};

const defaultQuizData = [
  { id: 1, type: 'mcq', question: "Choose the word whose underlined part is pronounced differently.", options: ["work<u>ed</u>", "clean<u>ed</u>", "watch<u>ed</u>", "stopp<u>ed</u>"], answer: 1, explain: "cleaned phát âm là /d/, còn lại phát âm là /t/.", translate: "A. làm việc, B. lau dọn, C. xem, D. dừng lại" },
  { id: 2, type: 'mcq', question: "Choose the word whose underlined part is pronounced differently.", options: ["ba<u>th</u>s", "mon<u>th</u>s", "pa<u>th</u>s", "clo<u>th</u>s"], answer: 3, explain: "cloths phát âm là /ðz/, còn lại là /θs/.", translate: "A. bồn tắm, B. tháng, C. con đường, D. mảnh vải" },
  { id: 3, type: 'mcq', question: "I wish I _____ speak English as fluently as my brother.", options: ["can", "could", "will", "would"], answer: 1, explain: "Câu ước ở hiện tại/tương lai dùng 'could' hoặc V2/ed.", translate: "Tôi ước tôi có thể nói tiếng Anh trôi chảy như anh trai tôi." },
  { id: 4, type: 'mcq', question: "If the weather _____ good, we will go camping tomorrow.", options: ["is", "was", "will be", "would be"], answer: 0, explain: "Câu điều kiện loại 1: If + S + V(hiện tại), S + will + V.", translate: "Nếu thời tiết đẹp, chúng tôi sẽ đi cắm trại vào ngày mai." },
  { id: 21, passageRef: "cloze1", type: 'mcq', question: "Choose the correct word for blank (21):", options: ["in", "on", "at", "of"], answer: 0, explain: "increase in something: sự gia tăng về cái gì.", translate: "Sự gia tăng (trong) dân số." },
  { id: 26, passageRef: "reading1", type: 'mcq', question: "What does the writer use the Internet for?", options: ["To play games", "To get information and communicate", "To buy things online", "To watch movies"], answer: 1, explain: "Trong bài: 'get information... communicate with my friends'.", translate: "Tác giả dùng Internet để làm gì? - Lấy thông tin và giao tiếp." },
  { id: 35, type: 'fill', question: "Type the missing part: 'They built this house in 2020.' -> This house [________________] in 2020.", answer: "was built", explain: "Câu bị động thì Quá khứ đơn: S + was/were + V3/ed.", translate: "Ngôi nhà này được xây vào năm 2020." },
  { id: 38, type: 'word_order', question: "Arrange the words to make a meaningful sentence:", shuffled: ["interested", "He", "history", "is", "in", "learning", "very", "local", "."], answer: "He is very interested in learning local history .", explain: "Cấu trúc: Be interested in + V-ing (quan tâm/thích làm gì).", translate: "Anh ấy rất thích thú với việc tìm hiểu lịch sử địa phương." },
  { id: 41, type: 'mcq', passageRef: 'listen1', isListening: true, question: "When was the Green Planet Eco Park established?", options: ["In 1985", "In 1995", "In 2005", "In 2015"], answer: 1, explain: "Trong bài nói: 'The park was established in 1995'.", translate: "Công viên sinh thái được thành lập khi nào?" },
  { id: 46, type: 'mcq', passageRef: 'listen2', isListening: true, question: "What did Mary choose for her science project?", options: ["Wind power", "Solar power", "Water power", "Nuclear power"], answer: 1, explain: "Trong bài nói Mary: 'I decided to focus on solar power'.", translate: "Mary đã chọn đề tài gì cho dự án khoa học?" }
];

const defaultExam = {
  id: 'default-exam-1',
  name: 'luyện đề đi các tình iu',
  color: 'from-cyan-500 to-indigo-600',
  createdAt: new Date().toISOString(),
  quizData: defaultQuizData,
  passages: defaultPassages,
  isFull: false
};

// ==========================================
// STYLES & EFFECTS (PRO MAX VERSION)
// ==========================================
const styleTag = `
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800;900&display=swap');

:root {
  --primary-glow: rgba(34, 211, 238, 0.5);
  --secondary-glow: rgba(168, 85, 247, 0.5);
}

body { 
  font-family: 'Lexend', sans-serif; 
  background: #050515; 
  color: #f8fafc;
  overflow-x: hidden; 
  scroll-behavior: smooth;
}

/* Base Galaxy Background */
.bg-galaxy {
  background: radial-gradient(ellipse at 20% 30%, rgba(34, 40, 92, 0.8) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(11, 29, 56, 0.6) 0%, transparent 50%),
              #050515;
}

/* Breathing Environment Glow */
.breathe-glow {
  animation: breathe 8s ease-in-out infinite alternate;
}
@keyframes breathe {
  0% { transform: scale(1); opacity: 0.4; filter: blur(100px); }
  100% { transform: scale(1.1); opacity: 0.7; filter: blur(120px); }
}

/* Glassmorphism Pro */
.glass { 
  background: rgba(15, 23, 42, 0.4); 
  backdrop-filter: blur(20px); 
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08); 
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}

.glass-panel {
  background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
  backdrop-filter: blur(24px);
  border-top: 1px solid rgba(255,255,255,0.1);
  border-left: 1px solid rgba(255,255,255,0.1);
}

/* Mirror Glow Hover Effect */
.mirror-glow {
  position: relative;
  overflow: hidden;
}
.mirror-glow::before {
  content: '';
  position: absolute;
  top: 0; left: -100%; width: 50%; height: 100%;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
  transform: skewX(-20deg);
  transition: 0.5s;
}
.mirror-glow:hover::before {
  left: 200%;
  transition: 0.7s ease-in-out;
}

/* Scrollbar Customization */
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }

/* Shake Animation for Wrong Answers */
.shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake {
  10%, 90% { transform: translate3d(-2px, 0, 0); }
  20%, 80% { transform: translate3d(4px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-6px, 0, 0); }
  40%, 60% { transform: translate3d(6px, 0, 0); }
}

/* Audio Wave Visualizer */
.audio-wave { display: flex; align-items: center; justify-content: center; gap: 4px; }
.audio-wave span { 
  display: block; width: 6px; height: 10px; background: #22d3ee; 
  border-radius: 4px; animation: wave 1.2s ease-in-out infinite alternate; 
}
.audio-wave.playing span { animation-play-state: running; }
.audio-wave.paused span { animation-play-state: paused; height: 10px; }
.audio-wave span:nth-child(2) { animation-delay: -0.2s; }
.audio-wave span:nth-child(3) { animation-delay: -0.4s; }
.audio-wave span:nth-child(4) { animation-delay: -0.6s; }
.audio-wave span:nth-child(5) { animation-delay: -0.8s; }
@keyframes wave { 0% { height: 10px; background: #22d3ee; } 100% { height: 40px; background: #c084fc; } }

/* Compliment Particle Burst Pro */
@keyframes cosmic-pop {
  0% { transform: scale(0.3) translateY(40px) rotate(-10deg); opacity: 0; filter: blur(20px); }
  40% { transform: scale(1.1) translateY(-10px) rotate(3deg); opacity: 1; filter: blur(0px); }
  70% { transform: scale(1) translateY(0) rotate(0deg); opacity: 1; filter: brightness(1.2); }
  100% { transform: scale(1.2) translateY(-20px) rotate(5deg); opacity: 0; filter: blur(10px); }
}
@keyframes particle-burst-pro {
  0% { transform: translate(0, 0) scale(0); opacity: 1; }
  20% { transform: translate(calc(var(--tx) * 0.2), calc(var(--ty) * 0.2)) scale(1.5); opacity: 1; }
  100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
}
@keyframes cosmic-shine { to { background-position: 200% center; } }
@keyframes ring-expand-pro {
  0% { transform: scale(0); opacity: 0; border-width: 30px; box-shadow: inset 0 0 0 rgba(255,255,255,0); }
  20% { opacity: 1; border-width: 20px; box-shadow: inset 0 0 50px rgba(232, 121, 249, 0.8); }
  100% { transform: scale(2.5); opacity: 0; border-width: 0px; box-shadow: inset 0 0 0 rgba(232, 121, 249, 0); }
}

.compliment-container { animation: cosmic-pop 2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
.compliment-text-v2 {
  background: linear-gradient(to right, #a5f3fc, #d8b4fe, #f472b6, #22d3ee, #a5f3fc);
  background-size: 200% auto;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  animation: cosmic-shine 2s linear infinite;
  text-shadow: 0 0 20px rgba(255,255,255,0.1);
}
.nova-ring-2 {
  position: absolute; inset: -80px; border-radius: 50%;
  border: 30px solid rgba(232, 121, 249, 0.6);
  animation: ring-expand-pro 1.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
  pointer-events: none;
}

/* Utility classes */
.text-gradient {
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.dangerously-html u { text-decoration-color: #22d3ee; text-underline-offset: 4px; }
.dangerously-html b { color: #818cf8; }
`;

// ==========================================
// BACKGROUND COMPONENTS
// ==========================================
const GalaxyBackground = React.memo(() => {
  const [stars] = useState(() => 
    Array.from({ length: 150 }).map((_, i) => ({
      id: i, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
      size: `${Math.random() * 2.5 + 0.5}px`, delay: `${Math.random() * 5}s`, dur: `${Math.random() * 4 + 2}s`,
      color: Math.random() > 0.8 ? '#a5f3fc' : Math.random() > 0.6 ? '#d8b4fe' : '#ffffff'
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-0 bg-galaxy overflow-hidden">
      {stars.map((s) => (
        <div key={s.id} className="absolute rounded-full shadow-[0_0_10px_currentColor] animate-[twinkle_infinite_alternate]"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay, animationDuration: s.dur, backgroundColor: s.color, color: s.color }}
        />
      ))}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full breathe-glow mix-blend-screen"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full breathe-glow mix-blend-screen" style={{ animationDelay: '-4s' }}></div>
    </div>
  );
});

const GalaxyCompliment = React.memo(({ text }) => {
  const [particles] = useState(() => Array.from({ length: 40 }).map((_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 150 + Math.random() * 300;
    const size = 3 + Math.random() * 12;
    const colors = ['#22d3ee', '#818cf8', '#c084fc', '#f472b6', '#fcd34d', '#ffffff'];
    return {
      id: i, color: colors[Math.floor(Math.random() * colors.length)], size: `${size}px`,
      tx: `${Math.cos(angle) * distance}px`, ty: `${Math.sin(angle) * distance}px`,
      delay: `${Math.random() * 0.2}s`
    };
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden bg-black/40 backdrop-blur-sm transition-opacity duration-300">
       <div className="relative flex items-center justify-center compliment-container z-10">
          <div className="nova-ring-2"></div>
          {particles.map(p => (
            <div key={p.id} className="absolute rounded-full z-0 shadow-lg"
                 style={{
                   width: p.size, height: p.size, backgroundColor: p.color,
                   boxShadow: `0 0 20px ${p.color}, 0 0 40px ${p.color}`,
                   animation: `particle-burst-pro 2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards`,
                   animationDelay: p.delay, '--tx': p.tx, '--ty': p.ty,
                 }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/40 via-purple-500/40 to-pink-500/40 blur-[120px] -z-10 rounded-full scale-[2.5] opacity-0 animate-[fade-in-out_2s_ease-in-out_forwards]"></div>
          <div className="compliment-wrapper relative z-20 mix-blend-screen">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black compliment-text-v2 text-center px-6 py-4 leading-tight tracking-tighter uppercase">
              {text}
            </h1>
          </div>
       </div>
    </div>
  );
});

// ==========================================
// EXAM PLAYER COMPONENT (CORE)
// ==========================================
const ExamPlayer = ({ exam, onExit, onComplete }) => {
  const { quizData, passages } = exam;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [revealedQuestions, setRevealedQuestions] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(exam.isFull ? 90 * 60 : 15 * 60); 
  const [showGrid, setShowGrid] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [textSizeScale, setTextSizeScale] = useState(1);
  const [compliment, setCompliment] = useState(null); 
  const [bookmarked, setBookmarked] = useState(new Set());
  const [aiFeedback, setAiFeedback] = useState({}); 
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(null); 
  
  // Audio State
  const synth = window.speechSynthesis;
  const [audioSpeed, setAudioSpeed] = useState(1);
  const [isShadowing, setIsShadowing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Swipe State
  const touchStartX = useRef(null);

  const showTrendyCompliment = useCallback(() => {
    const praises = [
      "hú hú tuyệt em yêu ơi!", "oi thoi chec đúng rùi!", "ái sài kinhh!", 
      "trình là gièee!", "vclll hayy!", "giỏi thế này chị rỉ cưng ơi!"
    ];
    setCompliment(praises[Math.floor(Math.random() * praises.length)]);
    setTimeout(() => setCompliment(null), 2000);
  }, []);

  // Audio Logic
  const speakAI = useCallback((text, forceSpeed = audioSpeed, forceLoop = isShadowing) => {
    if (!text) return;
    synth.cancel();
    
    // Strip HTML tags for speech
    const cleanText = text.replace(/<[^>]*>?/gm, '').replace(/_+/g, 'blank').replace(/\[___\]/g, 'blank');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = synth.getVoices();
    const premiumVoice = voices.find(v => v.name.includes("Google US English")) || voices.find(v => v.lang.startsWith("en-US")) || voices.find(v => v.lang.startsWith("en"));
    if (premiumVoice) utterance.voice = premiumVoice;
    utterance.rate = forceSpeed;
    utterance.pitch = 1.05; 
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
      if (forceLoop) speakAI(text, forceSpeed, forceLoop);
    };
    utterance.onerror = () => setIsPlaying(false);

    synth.speak(utterance);
  }, [synth, audioSpeed, isShadowing]);

  const speakOptions = useCallback((options) => {
    if (!options || options.length === 0) return;
    const textToRead = options.map((opt, i) => `${['A', 'B', 'C', 'D'][i]}: ${opt.replace(/<[^>]*>?/gm, '')}`).join(". ");
    speakAI(textToRead);
  }, [speakAI]);

  useEffect(() => {
    return () => synth.cancel(); // Cleanup on unmount
  }, [synth]);

  // Timer Logic
  useEffect(() => {
    let timer;
    if (!isSubmitted && timeRemaining > 0) {
      timer = setInterval(() => setTimeRemaining(p => p - 1), 1000);
    } else if (timeRemaining === 0 && !isSubmitted) {
      handleSubmitFinal();
    }
    return () => clearInterval(timer);
  }, [isSubmitted, timeRemaining]);

  // SMART HOTKEYS SYSTEM
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (isSubmitted) return;

      const key = e.key.toLowerCase();
      const currentQ = quizData[currentIndex];

      if (e.code === 'Space') { e.preventDefault(); handleNext(); return; }
      if (key === 'r') { e.preventDefault(); if (currentQ.passageRef && currentQ.isListening) speakAI(passages[currentQ.passageRef]); else speakAI(currentQ.question); return; }
      if (key === 't') { e.preventDefault(); /* Mock translation toggle or focus */ return; }
      if (e.key === 'Shift') { e.preventDefault(); handlePrev(); return; }
      
      if (currentQ.type === 'mcq') {
        const map = { 'z': 0, 'a': 0, '1': 0, 'x': 1, 'b': 1, '2': 1, 'c': 2, '3': 2, 'v': 3, 'd': 3, '4': 3 };
        if (map[key] !== undefined) handleSelectMCQ(currentQ.id, map[key]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isSubmitted, quizData]);

  // Swipe Mobile Logic
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    touchStartX.current = null;
  };

  const handleNext = () => currentIndex < quizData.length - 1 && setCurrentIndex(currentIndex + 1);
  const handlePrev = () => currentIndex > 0 && setCurrentIndex(currentIndex - 1);

  const triggerShake = () => { setIsShaking(true); setTimeout(() => setIsShaking(false), 400); };

  const handleSelectMCQ = (qId, optIdx) => {
    if (isSubmitted || revealedQuestions[qId]) return;
    setUserAnswers(prev => ({ ...prev, [qId]: optIdx }));
    setRevealedQuestions(prev => ({ ...prev, [qId]: true }));
    const isCorrect = quizData.find(q => q.id === qId).answer === optIdx;
    if (isCorrect) showTrendyCompliment(); else triggerShake();
  };

  const handleFill = (qId, val) => { if (!isSubmitted) setUserAnswers(prev => ({ ...prev, [qId]: val })); };
  const checkFill = (qId) => {
    if (revealedQuestions[qId] || isSubmitted) return;
    setRevealedQuestions(prev => ({ ...prev, [qId]: true }));
    const q = quizData.find(q => q.id === qId);
    const isCorrect = (userAnswers[qId] || "").toLowerCase().trim() === q.answer.toLowerCase().trim();
    if (isCorrect) showTrendyCompliment(); else triggerShake();
  };

  const handleWordOrderClick = (qId, wordIdx, isSelected) => {
    if (isSubmitted || revealedQuestions[qId]) return;
    setUserAnswers(prev => {
      const currentAns = prev[qId] || [];
      return isSelected ? { ...prev, [qId]: currentAns.filter(i => i !== wordIdx) } : { ...prev, [qId]: [...currentAns, wordIdx] };
    });
  };
  const checkWordOrder = (qId) => {
    if (revealedQuestions[qId] || isSubmitted) return;
    setRevealedQuestions(prev => ({ ...prev, [qId]: true }));
    const q = quizData.find(q => q.id === qId);
    const userAnswerStr = (userAnswers[qId] || []).map(idx => q.shuffled[idx]).join(" ");
    if (userAnswerStr === q.answer) showTrendyCompliment(); else triggerShake();
  };

  const toggleBookmark = (qId) => {
    setBookmarked(prev => {
      const newSet = new Set(prev);
      if (newSet.has(qId)) newSet.delete(qId);
      else newSet.add(qId);
      return newSet;
    });
  };

  const handleSubmitFinal = () => {
    let s = 0;
    quizData.forEach(q => {
      const u = userAnswers[q.id];
      if (q.type === 'mcq' && u === q.answer) s++;
      else if (q.type === 'fill' && String(u || '').toLowerCase().trim() === q.answer.toLowerCase().trim()) s++;
      else if (q.type === 'word_order' && (u || []).map(idx => q.shuffled[idx]).join(" ") === q.answer) s++;
    });
    setScore(s);
    setIsSubmitted(true);
    setShowGrid(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (onComplete) onComplete(s, quizData.length, userAnswers);
  };

  // AI Mentor PRO Feature
  const askAIMentorPro = async (qId) => {
    setIsFetchingFeedback(qId);
    const q = quizData.find(q => q.id === qId);
    let userText = "", correctText = "";

    if (q.type === 'mcq') {
      userText = q.options[userAnswers[qId]] || "Chưa chọn";
      correctText = q.options[q.answer];
    } else if (q.type === 'fill') {
      userText = userAnswers[qId] || "Chưa nhập";
      correctText = q.answer;
    } else if (q.type === 'word_order') {
      userText = (userAnswers[qId] || []).map(idx => q.shuffled[idx]).join(" ") || "Chưa chọn";
      correctText = q.answer;
    }

    const prompt = `Phân tích câu Tiếng Anh thi vào 10 này. Câu hỏi: "${q.question}". Học sinh chọn: "${userText}". Đáp án đúng: "${correctText}". Trả về JSON với các field sau: 
    "explain": "Giải thích chi tiết lỗi sai hoặc củng cố kiến thức",
    "tip": "Mẹo làm bài dạng này",
    "commonMistake": "Lỗi sai phổ biến học sinh hay mắc phải",
    "memoryHook": "Cách nhớ nhanh (thơ, vần, quy tắc ngắn)",
    "strategy": "Chiến thuật làm bài (loại trừ, đọc lướt...)"
    `;
    const sysInst = `Bạn là chuyên gia luyện thi Tiếng Anh vào 10 chuyên nghiệp. Chỉ trả về JSON thuần túy theo schema yêu cầu, không kèm markdown \`\`\`json. Ngôn ngữ: Tiếng Việt, phong cách gần gũi, GenZ.`;

    try {
      const jsonStr = await fetchGeminiAPI(prompt, sysInst, true);
      const data = JSON.parse(jsonStr.replace(/```json\n?|```/g, ''));
      setAiFeedback(prev => ({ ...prev, [qId]: data }));
    } catch (error) {
      console.error(error);
      setAiFeedback(prev => ({ ...prev, [qId]: { explain: "Oops! Tín hiệu bị nhiễu. Thử lại sau nhé! 📡", tip: "", commonMistake: "", memoryHook: "", strategy: "" } }));
    } finally {
      setIsFetchingFeedback(null);
    }
  };

  const currentQ = quizData[currentIndex];
  if (!currentQ) return null;
  const isRevealed = revealedQuestions[currentQ.id];
  const userAns = userAnswers[currentQ.id];

  return (
    <div className="min-h-screen flex flex-col relative font-sans" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {compliment && <GalaxyCompliment text={compliment} />}

      {/* HEADER PRO */}
      <header className="fixed top-0 w-full glass z-50 border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={onExit} className="p-2 glass hover:bg-white/10 rounded-xl transition-all"><ChevronLeft /></button>
            <div className="hidden sm:block">
              <h1 className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400 uppercase">
                {exam.name}
              </h1>
              <p className="text-xs text-indigo-300 font-medium tracking-widest">PRO MAX EXAM ENGINE</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 mr-2">
               Kbd: <kbd className="bg-slate-700/50 px-1 rounded">Z</kbd> <kbd className="bg-slate-700/50 px-1 rounded">X</kbd> <kbd className="bg-slate-700/50 px-1 rounded">C</kbd> <kbd className="bg-slate-700/50 px-1 rounded">V</kbd> <kbd className="bg-slate-700/50 px-1 rounded">Space</kbd>
            </div>
            
            <div className="flex items-center glass rounded-xl border border-white/10 overflow-hidden">
               <button onClick={() => setTextSizeScale(s => Math.max(0.8, s - 0.1))} className="p-2 hover:bg-white/10 text-slate-300"><ZoomOut className="w-4 h-4" /></button>
               <div className="px-2 font-bold text-cyan-400 text-xs flex items-center gap-1 w-12 justify-center">{Math.round(textSizeScale * 100)}%</div>
               <button onClick={() => setTextSizeScale(s => Math.min(1.5, s + 0.1))} className="p-2 hover:bg-white/10 text-slate-300"><ZoomIn className="w-4 h-4" /></button>
            </div>
            
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl glass font-mono font-black border transition-all ${timeRemaining < 300 ? 'text-rose-400 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse' : 'text-cyan-400 border-cyan-500/20'}`}>
              <Clock className="w-4 h-4" />
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
            
            <button onClick={() => setShowGrid(!showGrid)} className="p-2 glass hover:bg-white/10 rounded-xl transition-all border border-white/10 text-indigo-300 relative">
              <Grip className="w-5 h-5" />
              {Object.keys(userAnswers).length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#050515]"></span>}
            </button>
          </div>
        </div>
        <div className="w-full h-1 bg-white/5">
          <div className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 transition-all duration-700 shadow-[0_0_15px_#06b6d4]" 
               style={{ width: `${((currentIndex + 1) / quizData.length) * 100}%` }} />
        </div>
      </header>

      {/* SIDEBAR GRID PRO */}
      <aside className={`fixed top-0 right-0 h-full w-80 glass-panel z-[60] transform transition-transform duration-500 shadow-2xl flex flex-col ${showGrid ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/20">
          <h2 className="font-black flex items-center gap-2 uppercase tracking-wider text-cyan-300 text-sm"><Layers className="w-4 h-4" /> Bảng Câu Hỏi</h2>
          <button onClick={() => setShowGrid(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400"><XCircle className="w-5 h-5"/></button>
        </div>
        <div className="p-5 grid grid-cols-5 gap-2.5 overflow-y-auto flex-1 custom-scrollbar">
          {quizData.map((q, i) => {
            const isAns = revealedQuestions[q.id];
            const isBkmrk = bookmarked.has(q.id);
            let cls = "relative aspect-square rounded-xl font-extrabold text-sm flex items-center justify-center border-2 transition-all mirror-glow ";
            
            if (i === currentIndex) cls += "bg-indigo-600 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-110 z-10 ";
            else if (isAns) {
              let correct = false;
              if(q.type === 'mcq') correct = userAnswers[q.id] === q.answer;
              else if (q.type === 'fill') correct = String(userAnswers[q.id]).toLowerCase().trim() === q.answer.toLowerCase().trim();
              else if (q.type === 'word_order') correct = (userAnswers[q.id] || []).map(idx => q.shuffled[idx]).join(" ") === q.answer;
              cls += correct ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-rose-500/20 border-rose-500/50 text-rose-400";
            } else {
              cls += "bg-white/5 border-white/10 text-slate-400 hover:border-white/30";
            }
            return (
              <button key={q.id} onClick={() => setCurrentIndex(i)} className={cls}>
                {i + 1}
                {isBkmrk && <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_5px_#facc15]"></div>}
              </button>
            );
          })}
        </div>
        <div className="p-5 bg-black/40 border-t border-white/10">
          <div className="flex justify-between text-xs font-bold text-slate-400 mb-4 px-2">
            <span>Đã làm: {Object.keys(userAnswers).length}/{quizData.length}</span>
            <span>Đánh dấu: {bookmarked.size}</span>
          </div>
          <button onClick={handleSubmitFinal} disabled={isSubmitted} className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-xl font-black text-white shadow-xl hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2">
            {isSubmitted ? <><CheckCircle className="w-5 h-5"/> Đã Nộp Bài</> : "Nộp Bài Ngay"}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT PRO */}
      <main className={`flex-1 pt-24 md:pt-28 pb-32 px-4 md:px-6 max-w-7xl mx-auto w-full relative z-10 transition-transform ${isShaking ? 'shake' : ''}`}>
        
        {isSubmitted && (
          <div className="mb-8 p-8 glass rounded-[2rem] border-2 border-indigo-500/50 text-center shadow-[0_0_50px_rgba(79,70,229,0.3)] animate-in slide-in-from-top duration-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent"></div>
            <Award className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-bounce relative z-10 filter drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
            <h2 className="text-5xl font-black mb-2 text-white relative z-10">Điểm: <span className="text-cyan-400">{score}</span><span className="text-3xl text-slate-500">/{quizData.length}</span></h2>
            <div className="flex justify-center gap-2 mb-6 relative z-10">
              {score/quizData.length >= 0.8 ? <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-bold border border-emerald-500/50">Xuất Sắc</span> : 
               score/quizData.length >= 0.5 ? <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm font-bold border border-yellow-500/50">Khá Tốt</span> :
               <span className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-lg text-sm font-bold border border-rose-500/50">Cần Cố Gắng Thêm</span>}
            </div>
          </div>
        )}

        <div className={`flex flex-col ${currentQ.passageRef ? 'lg:flex-row' : ''} gap-6`}>
           
           {/* PASSAGE PANEL PRO */}
           {currentQ.passageRef && (
             <div className="lg:w-1/2 glass rounded-[2rem] p-6 border border-white/10 shadow-2xl flex flex-col h-[40vh] lg:h-[calc(100vh-220px)] lg:sticky top-28 overflow-hidden relative group">
               <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
               <div className="flex items-center justify-between mb-4 shrink-0 relative z-10">
                  <div className="flex items-center gap-2 text-cyan-400 font-black text-xs tracking-[0.2em] uppercase">
                    {currentQ.isListening ? <><Headphones className="w-4 h-4"/> Listening Skill</> : <><BookOpen className="w-4 h-4" /> Reading Skill</>}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {currentQ.isListening && (
                      <div className="flex items-center bg-black/40 rounded-lg border border-white/10 p-1 mr-2">
                        <button onClick={() => setAudioSpeed(1)} className={`px-2 py-1 text-xs font-bold rounded ${audioSpeed===1 ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}>1x</button>
                        <button onClick={() => setAudioSpeed(0.75)} className={`px-2 py-1 text-xs font-bold rounded ${audioSpeed===0.75 ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}>0.75x</button>
                        <button onClick={() => setIsShadowing(!isShadowing)} className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 ${isShadowing ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'}`} title="Shadowing Loop"><Repeat className="w-3 h-3"/></button>
                      </div>
                    )}
                    <button onClick={() => isPlaying ? synth.cancel() : speakAI(passages[currentQ.passageRef])} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold transition-all shadow-lg active:scale-95">
                      {isPlaying ? <PauseCircle className="w-4 h-4 text-rose-400"/> : currentQ.isListening ? <Radio className="w-4 h-4"/> : <PlayCircle className="w-4 h-4"/>} 
                      {isPlaying ? "Dừng" : "Phát"}
                    </button>
                  </div>
               </div>
               
               {currentQ.isListening ? (
                 <div className="flex-1 flex flex-col items-center justify-center bg-black/30 rounded-2xl border border-white/5 relative overflow-hidden mt-2">
                    <button onClick={() => isPlaying ? synth.cancel() : speakAI(passages[currentQ.passageRef])} className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center text-cyan-400 hover:scale-110 transition-transform border border-cyan-400/30 shadow-[0_0_30px_rgba(34,211,238,0.2)] z-10 relative group">
                      {isPlaying ? <PauseCircle className="w-12 h-12" /> : <Play className="w-10 h-10 ml-2" />}
                      <div className="absolute inset-0 rounded-full border-2 border-cyan-400/50 scale-150 opacity-0 group-hover:animate-ping"></div>
                    </button>
                    <p className="mt-8 text-slate-400 font-medium z-10 text-center px-6 text-sm">Transcript is hidden to practice listening skills.<br/>Click play to start audio.</p>
                    <div className={`mt-6 audio-wave ${isPlaying ? 'playing' : 'paused'} z-10`}>
                      <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
                    </div>
                 </div>
               ) : (
                 <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 text-slate-200 leading-relaxed font-medium mt-2" style={{ fontSize: `${16 * textSizeScale}px` }}>
                   {passages[currentQ.passageRef].split('\n').map((para, i) => (
                      <p key={i} className="mb-4 text-justify dangerously-html" dangerouslySetInnerHTML={{ __html: para }}></p>
                   ))}
                 </div>
               )}
             </div>
           )}

           {/* QUESTION PANEL PRO */}
          <div className={`glass rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden border border-white/10 flex-1 flex flex-col group`}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-2 w-[80%]">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-[10px] font-black tracking-widest uppercase border border-indigo-500/30 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Q.{currentIndex + 1}
                  </span>
                  {currentQ.type === 'mcq' && <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold uppercase border border-emerald-500/30">Multiple Choice</span>}
                  {currentQ.type === 'fill' && <span className="px-2 py-1 bg-pink-500/20 text-pink-400 rounded text-[10px] font-bold uppercase border border-pink-500/30">Fill in blank</span>}
                </div>
                {/* DANGEROUSLY SET HTML FOR QUESTIONS (Supports <u>, <b>, <i>) */}
                <h3 className="font-bold leading-relaxed text-white dangerously-html" style={{ fontSize: `${22 * textSizeScale}px` }} dangerouslySetInnerHTML={{ __html: currentQ.question }}></h3>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button onClick={() => toggleBookmark(currentQ.id)} className={`p-2.5 rounded-xl border transition-all shadow-md ${bookmarked.has(currentQ.id) ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400' : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`} title="Đánh dấu câu này">
                  {bookmarked.has(currentQ.id) ? <BookmarkCheck className="w-5 h-5"/> : <Bookmark className="w-5 h-5"/>}
                </button>
                {currentQ.type === 'mcq' && (
                  <button onClick={() => speakOptions(currentQ.options)} className="p-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/20 transition-all hover:scale-110 active:scale-90 shadow-md" title="Nghe các đáp án">
                    <Volume2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {(isRevealed || isSubmitted) && currentQ.translate && (
              <div className="mb-6 p-4 bg-indigo-950/40 border-l-4 border-indigo-400 rounded-r-xl animate-in fade-in duration-500 text-sm">
                <div className="flex items-center gap-1.5 text-indigo-300 mb-1 font-bold uppercase tracking-wider text-[10px]"><Globe className="w-3 h-3" /> Dịch nghĩa</div>
                <p className="text-slate-300 italic dangerously-html" style={{ fontSize: `${15 * textSizeScale}px` }} dangerouslySetInnerHTML={{ __html: currentQ.translate }}></p>
              </div>
            )}

            {/* 1. TRẢ LỜI MCQ PRO */}
            {currentQ.type === 'mcq' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = userAns === idx;
                  const isCorrect = currentQ.answer === idx;
                  let btnCls = "w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group relative overflow-hidden ";
                  
                  if (isRevealed || isSubmitted) {
                    if (isCorrect) btnCls += "bg-emerald-500/10 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)] text-emerald-50 ";
                    else if (isSelected) btnCls += "bg-rose-500/10 border-rose-500/60 text-rose-50 ";
                    else btnCls += "bg-black/20 border-white/5 opacity-50 ";
                  } else {
                    btnCls += isSelected 
                      ? "bg-indigo-600/80 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] text-white scale-[1.02] " 
                      : "bg-black/40 border-white/10 hover:border-indigo-400 hover:bg-white/5 text-slate-300 mirror-glow ";
                  }
                  const keys = ['Z', 'X', 'C', 'V'];
                  return (
                    <button key={idx} onClick={() => handleSelectMCQ(currentQ.id, idx)} disabled={isRevealed || isSubmitted} className={btnCls}>
                      <div className="flex items-center gap-3 relative z-10 w-full pr-8">
                        <span className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-black text-sm transition-all ${
                          isSelected && !isRevealed ? 'bg-cyan-400 text-slate-900 shadow-md' : 
                          isRevealed && isCorrect ? 'bg-emerald-500 text-white' :
                          isRevealed && isSelected && !isCorrect ? 'bg-rose-500 text-white' :
                          'bg-white/10 text-slate-400 group-hover:bg-indigo-500 group-hover:text-white'
                        }`}>
                          {['A','B','C','D'][idx]}
                        </span>
                        {/* Option rendered with HTML */}
                        <span className="font-semibold dangerously-html leading-tight" style={{ fontSize: `${16 * textSizeScale}px` }} dangerouslySetInnerHTML={{ __html: opt }}></span>
                      </div>
                      <div className="flex items-center gap-2 relative z-10 absolute right-4">
                        {(!isRevealed && !isSubmitted) && <kbd className="hidden lg:inline-block bg-black/50 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 uppercase border border-white/5 shadow-inner">{keys[idx]}</kbd>}
                        {isRevealed && isCorrect && <CheckCircle className="text-emerald-400 w-5 h-5 animate-in zoom-in shrink-0" />}
                        {isRevealed && isSelected && !isCorrect && <AlertCircle className="text-rose-400 w-5 h-5 animate-in zoom-in shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. TRẢ LỜI FILL PRO */}
            {currentQ.type === 'fill' && (
              <div className="space-y-4 flex-1 mt-4">
                <div className="relative group">
                  <input 
                    type="text" value={userAns || ''} onChange={(e) => handleFill(currentQ.id, e.target.value)} onKeyPress={(e) => e.key === 'Enter' && checkFill(currentQ.id)} disabled={isRevealed || isSubmitted} placeholder="Type your answer here..."
                    className={`w-full bg-black/40 border-2 rounded-2xl p-5 pl-12 font-bold transition-all outline-none focus:ring-4 focus:ring-cyan-500/10 ${
                      isRevealed ? (String(userAns).toLowerCase().trim() === currentQ.answer.toLowerCase().trim() ? 'border-emerald-500/60 text-emerald-400' : 'border-rose-500/60 text-rose-400') : 'border-white/10 focus:border-cyan-400/50 text-cyan-300 placeholder:text-slate-600'
                    }`}
                    style={{ fontSize: `${18 * textSizeScale}px` }}
                  />
                  <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  {!isRevealed && !isSubmitted && (
                    <button onClick={() => checkFill(currentQ.id)} className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all">
                      Check
                    </button>
                  )}
                </div>
                {isRevealed && String(userAns).toLowerCase().trim() !== currentQ.answer.toLowerCase().trim() && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl animate-in slide-in-from-bottom duration-500 flex items-center gap-4">
                    <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-emerald-400/80 font-bold text-xs uppercase mb-0.5 tracking-wider">Correct Answer:</div>
                      <div className="font-black text-emerald-300 text-lg">{currentQ.answer}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. WORD ORDER PRO */}
            {currentQ.type === 'word_order' && (
              <div className="space-y-6 flex-1 mt-2">
                <div className={`min-h-[80px] w-full bg-black/40 border-2 rounded-2xl p-5 transition-all flex flex-wrap gap-2 items-start content-start ${
                     isRevealed ? (((userAns || []).map(idx => currentQ.shuffled[idx]).join(" ") === currentQ.answer) ? 'border-emerald-500/60' : 'border-rose-500/60') : 'border-cyan-500/20 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]'
                }`}>
                  {(userAns || []).length === 0 && !isRevealed && <span className="text-slate-600 text-sm font-medium mt-1">Tap words below to build the sentence...</span>}
                  {(userAns || []).map((wordIdx, pos) => (
                    <button key={`sel-${wordIdx}-${pos}`} onClick={() => handleWordOrderClick(currentQ.id, wordIdx, true)} disabled={isRevealed || isSubmitted}
                      className={`px-4 py-2 rounded-lg font-bold transition-all shadow-sm active:scale-95 ${
                        isRevealed ? (((userAns || []).map(idx => currentQ.shuffled[idx]).join(" ") === currentQ.answer) ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'bg-rose-500/20 text-rose-300 border border-rose-500/50') : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 hover:border-cyan-400'
                      }`} style={{ fontSize: `${16 * textSizeScale}px` }}>{currentQ.shuffled[wordIdx]}</button>
                  ))}
                </div>

                {!isRevealed && !isSubmitted && (
                  <div className="flex flex-wrap gap-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                    {currentQ.shuffled.map((word, idx) => {
                      if ((userAns || []).includes(idx)) return null;
                      return (
                        <button key={`avail-${idx}`} onClick={() => handleWordOrderClick(currentQ.id, idx, false)}
                          className="px-4 py-2 bg-slate-800 hover:bg-indigo-500 hover:text-white text-slate-300 rounded-lg font-medium transition-all border border-white/10 shadow-sm active:scale-95"
                          style={{ fontSize: `${16 * textSizeScale}px` }}>{word}</button>
                      );
                    })}
                  </div>
                )}
                {!isRevealed && !isSubmitted && (
                  <div className="flex justify-end">
                    <button onClick={() => checkWordOrder(currentQ.id)} disabled={(userAns || []).length !== currentQ.shuffled.length}
                      className="px-6 py-2.5 bg-cyan-500 text-slate-900 rounded-xl font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 text-sm">Check Sentence</button>
                  </div>
                )}
                {isRevealed && ((userAns || []).map(idx => currentQ.shuffled[idx]).join(" ") !== currentQ.answer) && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl animate-in slide-in-from-bottom duration-500">
                    <div className="text-emerald-400/80 font-bold text-[10px] uppercase mb-2 tracking-wider">Correct Sentence:</div>
                    <div className="font-bold text-emerald-300" style={{ fontSize: `${16 * textSizeScale}px` }}>{currentQ.answer}</div>
                  </div>
                )}
              </div>
            )}

            {/* GIẢI THÍCH & AI MENTOR PRO JSON STRUCTURE */}
            {(isRevealed || isSubmitted) && (
              <div className="mt-8 space-y-4">
                {currentQ.explain && (
                  <div className="p-5 bg-white/5 border border-white/10 rounded-2xl animate-in fade-in duration-500 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="text-yellow-400 w-4 h-4" />
                      <h4 className="font-bold text-yellow-400 text-xs uppercase tracking-wider">Giải thích cơ bản</h4>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed" style={{ fontSize: `${15 * textSizeScale}px` }}>{currentQ.explain}</p>
                  </div>
                )}

                <div className="p-1 rounded-2xl bg-gradient-to-r from-purple-600/30 via-pink-500/30 to-blue-600/30">
                  <div className="p-5 bg-[#0a0a1a] rounded-xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-2">
                        <Sparkles className="text-purple-400 w-4 h-4" />
                        <h4 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 text-sm uppercase tracking-wider">AI Mentor Pro</h4>
                      </div>
                      
                      {!aiFeedback[currentQ.id] && (
                        <button onClick={() => askAIMentorPro(currentQ.id)} disabled={isFetchingFeedback === currentQ.id}
                          className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/50 text-purple-300 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-[0_0_10px_rgba(168,85,247,0.2)] transition-all disabled:opacity-50">
                          {isFetchingFeedback === currentQ.id ? <><Loader2 className="w-3 h-3 animate-spin" /> Phân tích...</> : <><Cpu className="w-3 h-3" /> Chẩn đoán sâu</>}
                        </button>
                      )}
                    </div>
                    
                    <div className="relative z-10">
                       {aiFeedback[currentQ.id] ? (
                         <div className="space-y-3 animate-in slide-in-from-top-4 duration-500 text-sm">
                           {aiFeedback[currentQ.id].explain && (
                             <div><span className="text-purple-300 font-bold block mb-1">🔍 Phân tích:</span><span className="text-slate-300 leading-relaxed">{aiFeedback[currentQ.id].explain}</span></div>
                           )}
                           {aiFeedback[currentQ.id].tip && (
                             <div><span className="text-pink-300 font-bold block mb-1">💡 Mẹo làm bài:</span><span className="text-slate-300 leading-relaxed">{aiFeedback[currentQ.id].tip}</span></div>
                           )}
                           {aiFeedback[currentQ.id].commonMistake && (
                             <div className="bg-rose-500/10 p-2 rounded-lg border border-rose-500/20"><span className="text-rose-400 font-bold block mb-1">⚠️ Lỗi hay gặp:</span><span className="text-slate-300">{aiFeedback[currentQ.id].commonMistake}</span></div>
                           )}
                           {(aiFeedback[currentQ.id].memoryHook || aiFeedback[currentQ.id].strategy) && (
                             <div className="grid grid-cols-2 gap-3 mt-2">
                               {aiFeedback[currentQ.id].memoryHook && <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20"><span className="text-cyan-400 font-bold text-xs block mb-1">🧠 Cách nhớ</span><span className="text-slate-300 text-xs italic">"{aiFeedback[currentQ.id].memoryHook}"</span></div>}
                               {aiFeedback[currentQ.id].strategy && <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20"><span className="text-indigo-400 font-bold text-xs block mb-1">🎯 Chiến thuật</span><span className="text-slate-300 text-xs">{aiFeedback[currentQ.id].strategy}</span></div>}
                             </div>
                           )}
                         </div>
                       ) : (
                         <p className="text-slate-500 text-xs italic">AI Mentor Pro sẽ phân tích ngữ pháp, bẫy đề thi và cung cấp mẹo giải nhanh, cách nhớ lâu cho riêng câu này.</p>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* STICKY BOTTOM BAR PRO */}
      <footer className="fixed bottom-0 w-full glass p-3 md:p-4 border-t border-white/10 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-1">
          <button onClick={handlePrev} disabled={currentIndex === 0} className="flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-2.5 glass hover:bg-white/10 rounded-xl font-bold disabled:opacity-30 transition-all active:scale-95 border border-white/10 group text-sm">
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" /> 
            <span className="hidden sm:inline">Quay Lại</span>
          </button>

          <div className="flex-1 px-4 md:px-8 flex items-center justify-center">
            <div className="w-full max-w-md h-2 bg-black/50 rounded-full overflow-hidden border border-white/5 relative">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-300" style={{ width: `${((currentIndex + 1) / quizData.length) * 100}%` }}></div>
            </div>
            <span className="ml-3 text-xs font-black text-slate-400 shrink-0 w-12">{currentIndex + 1}/{quizData.length}</span>
          </div>
          
          <button onClick={handleNext} className="flex items-center gap-1.5 md:gap-2 px-5 md:px-8 py-2.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 rounded-xl font-black text-white shadow-[0_5px_20px_rgba(6,182,212,0.3)] hover:brightness-125 transition-all active:scale-95 group text-sm">
            <span className="hidden sm:inline">Tiếp Theo</span>
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </footer>
    </div>
  );
};

// ==========================================
// DASHBOARD COMPONENT (FACTORY LOBBY)
// ==========================================
const Dashboard = ({ onStartExam, exams, createExam, deleteExam, syncStatus }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newExamName, setNewExamName] = useState("");
  const [examType, setExamType] = useState('speed'); // 'speed' (10Q) or 'full' (50Q)
  const [themeColor, setThemeColor] = useState("from-cyan-500 to-indigo-600");
  const [loadingMsg, setLoadingMsg] = useState("");

  const themeOptions = [
    { label: "Cyber Neon", value: "from-cyan-500 to-indigo-600", bg: "bg-gradient-to-r from-cyan-500 to-indigo-600" },
    { label: "Plasma Pink", value: "from-fuchsia-500 to-pink-600", bg: "bg-gradient-to-r from-fuchsia-500 to-pink-600" },
    { label: "Toxic Green", value: "from-emerald-400 to-teal-600", bg: "bg-gradient-to-r from-emerald-400 to-teal-600" },
    { label: "Solar Flare", value: "from-orange-500 to-red-600", bg: "bg-gradient-to-r from-orange-500 to-red-600" },
    { label: "Deep Void", value: "from-slate-700 to-black", bg: "bg-gradient-to-r from-slate-700 to-black" }
  ];

  const handleGenerate = async () => {
    if (!newExamName.trim()) return;
    setIsCreating(true);
    setLoadingMsg("AI đang khởi động lõi tri thức...");
    
    try {
      const qCount = examType === 'full' ? 50 : 10;
      setLoadingMsg(`Đang sinh cấu trúc bài thi (${qCount} câu)...`);
      
      const prompt = `Tạo một đề thi trắc nghiệm Tiếng Anh vào lớp 10 với số lượng ${qCount} câu hỏi.
      Yêu cầu format TRẢ VỀ CHÍNH XÁC MỘT JSON OBJECT CÓ CẤU TRÚC SAU (không dùng markdown block \`\`\`json):
      {
        "passages": {
          "cloze1": "Văn bản điền từ (khoảng 100 từ, có đánh số chỗ trống (1), (2)...)",
          "reading1": "Văn bản đọc hiểu (khoảng 150 từ)",
          "listen1": "Văn bản bài nghe (đoạn hội thoại hoặc độc thoại)"
        },
        "quizData": [
          {
            "id": 1,
            "type": "mcq", // hoặc "fill", "word_order"
            "question": "Câu hỏi (có thể dùng <u>gạch chân</u>, <b>in đậm</b>)",
            "options": ["A", "B", "C", "D"], // Chỉ áp dụng cho mcq
            "answer": 0, // index của options nếu mcq, chuỗi nếu fill, mảng index không áp dụng nhưng trả về chuỗi câu đúng nếu word_order
            "explain": "Giải thích tiếng Việt",
            "translate": "Bản dịch tiếng Việt"
          }
        ]
      }
      
      Chú ý loại câu hỏi:
      - Đa số là "mcq" (trắc nghiệm 4 đáp án).
      - Phần cloze có passageRef="cloze1".
      - Phần đọc hiểu có passageRef="reading1".
      - Phần nghe có passageRef="listen1" và isListening=true.
      - Sinh ra ít nhất 1 câu "fill" (câu hỏi là: "Type the missing part: 'câu gốc' -> câu viết lại [_________]").
      - Sinh ra ít nhất 1 câu "word_order" (câu hỏi là "Arrange the words...", có mảng "shuffled" chứa các từ bị đảo lộn, answer là câu hoàn chỉnh).
      `;
      
      const sysInst = `Bạn là hệ thống tạo đề thi tự động. CHỈ trả về JSON nguyên thủy, không giải thích, không bọc trong markdown tag.`;
      
      const rawRes = await fetchGeminiAPI(prompt, sysInst, true);
      setLoadingMsg("Đang xử lý dữ liệu...");
      
      const cleanJson = rawRes.replace(/```json\n?|```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);
      
      // Ensure IDs are unique and correct
      if (parsedData.quizData && Array.isArray(parsedData.quizData)) {
        parsedData.quizData.forEach((q, idx) => q.id = idx + 1);
      }

      const newExam = {
        id: `exam-${Date.now()}`,
        name: newExamName,
        color: themeColor,
        createdAt: new Date().toISOString(),
        quizData: parsedData.quizData,
        passages: parsedData.passages,
        isFull: examType === 'full'
      };

      await createExam(newExam);
      setIsCreating(false);
      setNewExamName("");
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tạo đề bằng AI. Hãy thử lại hoặc dùng đề mẫu.");
      setIsCreating(false);
    }
  };

  const exportJSON = (exam) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exam, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `exam_${exam.id}.json`);
    dlAnchorElem.click();
  };

  return (
    <div className="min-h-screen relative overflow-hidden font-sans pt-20 pb-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* LOBBY HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                <Cpu className="text-cyan-400 w-8 h-8" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 uppercase">
                Exam Factory
              </h1>
            </div>
            <p className="text-slate-400 font-medium tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400"/> Hệ thống tạo đề thi Tiếng Anh 10 AI PRO MAX
            </p>
          </div>
          
          <div className="flex items-center gap-3 text-sm font-bold glass px-4 py-2 rounded-xl">
            {syncStatus === 'syncing' && <><Loader2 className="w-4 h-4 animate-spin text-cyan-400"/> Đồng bộ...</>}
            {syncStatus === 'synced' && <><CheckCircle className="w-4 h-4 text-emerald-400"/> Cloud Sync Bật</>}
            {syncStatus === 'local' && <><Save className="w-4 h-4 text-yellow-400"/> Lưu Local</>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CREATION PANEL */}
          <div className="lg:col-span-1 glass-panel rounded-[2rem] p-6 md:p-8 h-fit shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 blur-[50px] rounded-full group-hover:bg-cyan-500/20 transition-colors duration-1000"></div>
            
            <h2 className="text-xl font-black mb-6 uppercase tracking-wider flex items-center gap-2 text-white">
              <Plus className="w-5 h-5 text-cyan-400" /> Tạo Đề Mới
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tên Bộ Đề</label>
                <input type="text" value={newExamName} onChange={e => setNewExamName(e.target.value)} disabled={isCreating}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium"
                  placeholder="Ví dụ: Đề thi thử Sở Hà Nội..." />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Loại Đề</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setExamType('speed')} disabled={isCreating} className={`py-2 rounded-lg font-bold text-sm border transition-all ${examType==='speed' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-black/30 border-white/5 text-slate-500'}`}>Làm Nhanh (10 Câu)</button>
                  <button onClick={() => setExamType('full')} disabled={isCreating} className={`py-2 rounded-lg font-bold text-sm border transition-all ${examType==='full' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-black/30 border-white/5 text-slate-500'}`}>Full Test (50 Câu)</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Màu Chủ Đề</label>
                <div className="flex gap-2 flex-wrap">
                  {themeOptions.map(t => (
                    <button key={t.value} onClick={() => setThemeColor(t.value)} disabled={isCreating}
                      className={`w-8 h-8 rounded-full ${t.bg} border-2 transition-transform ${themeColor === t.value ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent hover:scale-105 opacity-50'}`}
                      title={t.label}
                    />
                  ))}
                </div>
              </div>

              <button onClick={handleGenerate} disabled={isCreating || !newExamName.trim()}
                className="w-full mt-4 py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-cyan-400 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {isCreating ? <><Loader2 className="w-4 h-4 animate-spin"/> {loadingMsg}</> : <><Sparkles className="w-4 h-4"/> Sinh Đề Bằng AI</>}
              </button>
            </div>
          </div>

          {/* EXAM LIST PANEL */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-black mb-4 uppercase tracking-wider flex items-center gap-2 text-white px-2">
              <Layers className="w-5 h-5 text-indigo-400" /> Thư Viện Đề
            </h2>
            
            {exams.length === 0 ? (
              <div className="glass rounded-[2rem] p-12 text-center border-dashed border-2 border-white/10">
                <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-400 mb-2">Chưa có đề thi nào</h3>
                <p className="text-slate-500">Tạo đề thi mới bằng AI ở cột bên trái.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exams.map(exam => (
                  <div key={exam.id} className="glass rounded-2xl p-5 border border-white/10 hover:border-white/30 transition-all group relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${exam.color}`}></div>
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="pl-3">
                        <h3 className="font-black text-lg text-white mb-1 group-hover:text-cyan-400 transition-colors line-clamp-1" title={exam.name}>{exam.name}</h3>
                        <p className="text-xs text-slate-400 font-medium">
                          {new Date(exam.createdAt).toLocaleDateString('vi-VN')} • {exam.quizData.length} câu hỏi
                        </p>
                      </div>
                      <div className={`p-1.5 rounded-lg bg-gradient-to-r ${exam.color} opacity-20 group-hover:opacity-100 transition-opacity`}>
                        <Award className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-6 pl-3">
                      <button onClick={() => onStartExam(exam)} className="flex-1 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/30 text-indigo-300 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-1.5 shadow-md">
                        <Play className="w-4 h-4" /> Làm Bài
                      </button>
                      <button onClick={() => exportJSON(exam)} className="p-2.5 bg-black/40 hover:bg-white/10 text-slate-400 hover:text-cyan-400 rounded-xl border border-white/5 transition-all" title="Export JSON">
                        <Download className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if(window.confirm('Xoá đề này?')) deleteExam(exam.id) }} className="p-2.5 bg-black/40 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl border border-white/5 transition-all" title="Xoá">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN APP ENTRY (ROUTING & STATE)
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [exams, setExams] = useState([]);
  const [currentExam, setCurrentExam] = useState(null);
  const [syncStatus, setSyncStatus] = useState('local'); // local, syncing, synced

  // Initialize Auth
  useEffect(() => {
    if (!auth) { setAuthChecked(true); return; } // No firebase config
    
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error", err);
      }
    };
    initAuth();

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  // Fetch / Sync Data
  useEffect(() => {
    // 1. Load from local as fallback/initial
    const localExams = JSON.parse(localStorage.getItem('pro_exams') || '[]');
    if (localExams.length === 0) {
      // Seed default exam
      localExams.push(defaultExam);
      localStorage.setItem('pro_exams', JSON.stringify(localExams));
    }
    
    if (!user || !db) {
      setExams(localExams);
      setSyncStatus('local');
      return;
    }

    // 2. Firebase Realtime Sync (MANDATORY RULE 1 & 3)
    setSyncStatus('syncing');
    const examsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'exams');
    const q = query(examsRef);
    
    const unsub = onSnapshot(q, (snapshot) => {
      const fbExams = [];
      snapshot.forEach(doc => fbExams.push({ ...doc.data(), id: doc.id }));
      
      // If Firebase is empty but we have local data, we should migrate local -> FB (simplification: just use FB if exists, else keep local for now)
      if (fbExams.length > 0) {
        setExams(fbExams.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
        localStorage.setItem('pro_exams', JSON.stringify(fbExams)); // Update local cache
      } else {
        setExams(localExams); // Fallback to local
      }
      setSyncStatus('synced');
    }, (err) => {
      console.error("Firestore sync error", err);
      setExams(localExams);
      setSyncStatus('local');
    });

    return () => unsub();
  }, [user]);

  // Actions
  const handleCreateExam = async (newExam) => {
    const updated = [newExam, ...exams];
    setExams(updated);
    localStorage.setItem('pro_exams', JSON.stringify(updated));

    if (user && db) {
      try {
        setSyncStatus('syncing');
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'exams', newExam.id), newExam);
        setSyncStatus('synced');
      } catch (e) {
        console.error("Firebase save failed", e);
        setSyncStatus('local');
      }
    }
  };

  const handleDeleteExam = async (id) => {
    const updated = exams.filter(e => e.id !== id);
    setExams(updated);
    localStorage.setItem('pro_exams', JSON.stringify(updated));

    if (user && db && !id.startsWith('default-')) {
      try {
        setSyncStatus('syncing');
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'exams', id));
        setSyncStatus('synced');
      } catch (e) { console.error("Firebase delete failed", e); }
    }
  };

  const saveResult = async (examId, score, total, answers) => {
    if (user && db && !examId.startsWith('default-')) {
      try {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'results'), {
          examId, score, total, answers, date: new Date().toISOString()
        });
      } catch (e) { console.error("Save result failed", e); }
    }
  };

  if (!authChecked) {
    return <div className="min-h-screen bg-[#050515] flex items-center justify-center text-cyan-400"><Loader2 className="w-10 h-10 animate-spin" /></div>;
  }

  return (
    <>
      <style>{styleTag}</style>
      <GalaxyBackground />
      {currentExam ? (
        <ExamPlayer 
          exam={currentExam} 
          onExit={() => setCurrentExam(null)} 
          onComplete={(s, t, a) => saveResult(currentExam.id, s, t, a)}
        />
      ) : (
        <Dashboard 
          exams={exams} 
          onStartExam={setCurrentExam} 
          createExam={handleCreateExam} 
          deleteExam={handleDeleteExam}
          syncStatus={syncStatus}
        />
      )}
    </>
  );
}