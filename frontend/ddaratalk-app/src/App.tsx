import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Home, Sparkles, Zap, Target, RefreshCw, ChevronRight, X, Volume2, VolumeX } from 'lucide-react';
import logo from './assets/ddaratalklogo.svg';
// 타입 정의
interface PronunciationScore {
  articulation: number;
  prosody: number;
  overall: number;
}

interface SampleSentence {
  id: number;
  text: string;
  difficulty: string;
  category: string;
}

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSentence, setSelectedSentence] = useState('');
  const [pronunciationScore, setPronunciationScore] = useState<PronunciationScore | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);

  // 샘플 문장 데이터 (카테고리 추가)
  const sampleSentences: SampleSentence[] = [
    { id: 1, text: "Hello, how are you today?", difficulty: "초급", category: "일상" },
    { id: 2, text: "The weather is beautiful this morning.", difficulty: "초급", category: "일상" },
    { id: 3, text: "I would like to order a cup of coffee.", difficulty: "중급", category: "주문" },
    { id: 4, text: "Could you tell me where the nearest station is?", difficulty: "중급", category: "길찾기" },
    { id: 5, text: "The conference will be held next Wednesday.", difficulty: "고급", category: "비즈니스" }
  ];

  // 녹음 시간 추적
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingTime(0);
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  // 녹음 시작/중지 함수
  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          setRecordedAudio(audioBlob);
          const url = URL.createObjectURL(audioBlob);
          setAudioURL(url);
          
          // 분석 시작
          setIsAnalyzing(true);
          
          // 녹음 후 임시 점수 생성 (실제로는 백엔드 API 호출)
          setTimeout(() => {
            setPronunciationScore({
              articulation: Math.floor(Math.random() * 30) + 70,
              prosody: Math.floor(Math.random() * 30) + 70,
              overall: Math.floor(Math.random() * 30) + 70
            });
            setIsAnalyzing(false);
          }, 2000);
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('녹음 시작 실패:', err);
        alert('마이크 접근 권한이 필요합니다.');
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
    }
  };

  // 오디오 재생/일시정지
  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // 재녹음 함수
  const resetRecording = () => {
    setRecordedAudio(null);
    setAudioURL('');
    setPronunciationScore(null);
    setIsPlaying(false);
    setIsAnalyzing(false);
  };

  // 점수에 따른 색상 결정
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#22c55e';
    if (score >= 80) return '#3b82f6';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  // 점수에 따른 이모지
  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🎉';
    if (score >= 80) return '👍';
    if (score >= 70) return '💪';
    return '📚';
  };

  // 메인 페이지 컴포넌트
  const HomePage = () => (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #F1EFEC, #D4C9BE)' }}>
      <div className="relative overflow-hidden">
        {/* 배경 장식 요소 */}
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: '#123458' }}></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: '#D4C9BE' }}></div>
        
        <div className="relative z-10 px-3 py-2 max-w-md mx-auto">
          {/* 헤더 */}
          {/* 헤더 */}
          <header>
  {/* 상단 타이틀 */}
  <div className="text-left mb-6">
    {/* 로고와 제목을 가로로 배치하기 위한 flex 컨테이너 */}
      <img
        src={logo}
        alt="따라톡 로고"
        className="h-20 w-auto -ml-4" // 로고 크기 조절: 텍스트 높이와 맞춤
      />
    <p className="text-[#030303] opacity-80">AI와 함께하는 영어 발음 학습</p>
  </div>
</header>


          {/* 특징 카드 */}
          <div className="space-y-4 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg transform transition-all hover:scale-[1.02]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#123458] to-[#1e4d7b] rounded-2xl flex items-center justify-center shadow-md">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#030303] mb-1">실시간 AI 분석</h3>
                  <p className="text-sm text-[#030303] opacity-70">녹음 즉시 정확한 발음 평가</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg transform transition-all hover:scale-[1.02]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#D4C9BE] to-[#b8a699] rounded-2xl flex items-center justify-center shadow-md">
                  <Target className="w-7 h-7 text-[#123458]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#030303] mb-1">맞춤형 피드백</h3>
                  <p className="text-sm text-[#030303] opacity-70">한국인 특화 발음 개선 가이드</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg transform transition-all hover:scale-[1.02]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#030303] to-[#2a2a2a] rounded-2xl flex items-center justify-center shadow-md">
                  <Sparkles className="w-7 h-7 text-[#F1EFEC]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#030303] mb-1">게임처럼 재미있게</h3>
                  <p className="text-sm text-[#030303] opacity-70">점수와 레벨로 동기부여 UP</p>
                </div>
              </div>
            </div>
          </div>

          {/* 시작 버튼 */}
          <button
            onClick={() => setCurrentPage('recording')}
            className="w-full bg-gradient-to-r from-[#123458] to-[#1e4d7b] text-[#F1EFEC] py-5 rounded-2xl font-semibold text-lg shadow-xl transform transition-all active:scale-95 hover:shadow-2xl flex items-center justify-center gap-3"
          >
            <span>발음 연습 시작</span>
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* 하단 장식 텍스트 */}
          <p className="text-center text-sm text-[#030303] opacity-50 mt-6">
            매일 5분, 완벽한 영어 발음을 향해 🚀
          </p>
        </div>
      </div>
    </div>
  );

  // 녹음 페이지 컴포넌트
  const RecordingPage = () => (
    <div className="min-h-screen bg-gradient-to-b from-[#F1EFEC] to-[#D4C9BE]">
      {/* 헤더 */}
      <header className="bg-[#F1EFEC]/95 backdrop-blur-sm sticky top-0 z-20 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <h1 className="text-xl font-bold text-[#123458]">발음 연습</h1>
          <button
            onClick={() => {
              setCurrentPage('home');
              resetRecording();
              setSelectedSentence('');
            }}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm active:scale-95"
          >
            <Home className="w-5 h-5 text-[#123458]" />
          </button>
        </div>
      </header>

      <div className="px-6 py-4 max-w-md mx-auto">
        {/* 문장 선택 화면 */}
        {!selectedSentence && (
          <div className="animate-fadeIn">
            <h2 className="text-lg font-semibold text-[#030303] mb-4">오늘은 어떤 문장을 연습할까요?</h2>
            
            <div className="space-y-3">
              {sampleSentences.map((sentence) => (
                <button
                  key={sentence.id}
                  onClick={() => setSelectedSentence(sentence.text)}
                  className="w-full bg-white/90 backdrop-blur-sm rounded-2xl p-5 text-left transform transition-all active:scale-[0.98] hover:shadow-lg group"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span 
                      className="text-[10px] font-medium px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: sentence.difficulty === '초급' ? '#D4C9BE' : 
                                       sentence.difficulty === '중급' ? '#123458' : '#030303',
                        color: sentence.difficulty === '초급' ? '#030303' : '#F1EFEC'
                      }}
                    >
                      {sentence.difficulty}
                    </span>
                    <span className="text-[10px] text-[#030303] opacity-60">
                      {sentence.category}
                    </span>
                  </div>
                  <p className="text-[15px] text-[#030303] leading-relaxed group-hover:text-[#123458] transition-colors">
                    {sentence.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 녹음 화면 */}
        {selectedSentence && (
          <div className="animate-fadeIn">
            {/* 선택된 문장 표시 */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[#123458]">연습 문장</span>
                {!isRecording && !audioURL && (
                  <button
                    onClick={() => {
                      setSelectedSentence('');
                      resetRecording();
                    }}
                    className="text-xs text-[#030303] opacity-60 hover:opacity-100"
                  >
                    다른 문장 선택
                  </button>
                )}
              </div>
              <p className="text-lg font-medium text-[#030303] leading-relaxed">
                {selectedSentence}
              </p>
            </div>

            {/* 녹음 인터페이스 */}
            {!pronunciationScore && (
              <div className="text-center py-12">
                {/* 녹음 버튼 */}
                <div className="relative inline-block">
                  {isRecording && (
                    <div className="absolute inset-0 bg-[#123458] rounded-full animate-ping opacity-20"></div>
                  )}
                  <button
                    onClick={toggleRecording}
                    disabled={isAnalyzing}
                    className={`relative w-32 h-32 rounded-full shadow-2xl transform transition-all active:scale-95 ${
                      isAnalyzing ? 'opacity-50' : ''
                    }`}
                    style={{
                      background: isRecording 
                        ? 'linear-gradient(135deg, #030303 0%, #2a2a2a 100%)' 
                        : 'linear-gradient(135deg, #123458 0%, #1e4d7b 100%)'
                    }}
                  >
                    {isAnalyzing ? (
                      <div className="w-8 h-8 border-3 border-[#F1EFEC] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    ) : isRecording ? (
                      <MicOff className="w-12 h-12 text-[#F1EFEC] mx-auto" />
                    ) : (
                      <Mic className="w-12 h-12 text-[#F1EFEC] mx-auto" />
                    )}
                  </button>
                </div>

                {/* 상태 텍스트 */}
                <p className="mt-6 text-[#030303] font-medium">
                  {isAnalyzing ? 'AI가 발음을 분석하고 있어요...' :
                   isRecording ? `녹음 중... ${recordingTime}초` : 
                   '버튼을 눌러 녹음을 시작하세요'}
                </p>

                {/* 녹음된 오디오 재생 */}
                {audioURL && !isRecording && !isAnalyzing && (
                  <div className="mt-8 bg-[#123458]/10 rounded-2xl p-4 max-w-xs mx-auto">
                    <audio ref={audioRef} src={audioURL} onEnded={() => setIsPlaying(false)} />
                    
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={togglePlayback}
                        className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm active:scale-95"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-4 h-4 text-[#123458]" />
                            <span className="text-sm font-medium text-[#123458]">일시정지</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 text-[#123458]" />
                            <span className="text-sm font-medium text-[#123458]">들어보기</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={resetRecording}
                        className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm active:scale-95"
                      >
                        <RefreshCw className="w-4 h-4 text-[#030303]" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 평가 결과 */}
            {pronunciationScore && (
              <div className="animate-slideUp">
                {/* 종합 점수 */}
                <div className="text-center mb-6">
                  <div className="inline-block">
                    <div 
                      className="w-36 h-36 rounded-full flex items-center justify-center shadow-2xl mx-auto"
                      style={{
                        background: `conic-gradient(${getScoreColor(pronunciationScore.overall)} ${pronunciationScore.overall * 3.6}deg, #e5e5e5 0deg)`
                      }}
                    >
                      <div className="w-28 h-28 bg-white rounded-full flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold" style={{ color: getScoreColor(pronunciationScore.overall) }}>
                          {pronunciationScore.overall}
                        </span>
                        <span className="text-xs text-[#030303] opacity-60">종합점수</span>
                      </div>
                    </div>
                    <p className="mt-3 text-2xl">{getScoreEmoji(pronunciationScore.overall)}</p>
                  </div>
                </div>

                {/* 세부 점수 */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center">
                    <p className="text-xs text-[#030303] opacity-60 mb-1">조음 정확도</p>
                    <p className="text-2xl font-bold" style={{ color: getScoreColor(pronunciationScore.articulation) }}>
                      {pronunciationScore.articulation}
                    </p>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center">
                    <p className="text-xs text-[#030303] opacity-60 mb-1">운율 & 억양</p>
                    <p className="text-2xl font-bold" style={{ color: getScoreColor(pronunciationScore.prosody) }}>
                      {pronunciationScore.prosody}
                    </p>
                  </div>
                </div>

                {/* AI 피드백 */}
                <div className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-lg mb-6">
                  <h3 className="font-semibold text-[#030303] mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#123458]" />
                    AI 피드백
                  </h3>
                  <p className="text-sm text-[#030303] leading-relaxed">
                    전반적으로 좋은 발음이에요! 특히 자음 발음이 정확합니다. 
                    문장의 리듬감을 더 살리면 원어민처럼 자연스러운 발음이 될 거예요. 
                    'conference'의 강세를 첫 음절에 두는 것을 잊지 마세요!
                  </p>
                </div>

                {/* 액션 버튼들 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      resetRecording();
                      setPronunciationScore(null);
                    }}
                    className="flex-1 bg-white py-3 rounded-2xl font-medium text-[#123458] shadow-sm active:scale-95"
                  >
                    다시 연습하기
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSentence('');
                      resetRecording();
                      setPronunciationScore(null);
                    }}
                    className="flex-1 bg-gradient-to-r from-[#123458] to-[#1e4d7b] py-3 rounded-2xl font-medium text-[#F1EFEC] shadow-sm active:scale-95"
                  >
                    다른 문장 연습
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return currentPage === 'home' ? <HomePage /> : <RecordingPage />;
};

export default App;