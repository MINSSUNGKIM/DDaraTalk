import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Home, Sparkles, Zap, Target, RefreshCw, ChevronRight, X, Volume2, VolumeX, Download } from 'lucide-react';
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
  const [actualMimeType, setActualMimeType] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);

  const sampleSentences: SampleSentence[] = [
    { id: 1, text: "Hello, how are you today?", difficulty: "초급", category: "일상" },
    { id: 2, text: "The weather is beautiful this morning.", difficulty: "초급", category: "일상" },
    { id: 3, text: "I would like to order a cup of coffee.", difficulty: "중급", category: "주문" },
    { id: 4, text: "Could you tell me where the nearest station is?", difficulty: "중급", category: "길찾기" },
    { id: 5, text: "The conference will be held next Wednesday.", difficulty: "고급", category: "비즈니스" }
  ];

  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      setRecordingTime(0);
    }
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, [isRecording]);

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeTypes = ['audio/wav', 'audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm'];
        let supportedMimeType = '';
        for (const type of mimeTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            supportedMimeType = type;
            break;
          }
        }
        if (!supportedMimeType) {
          alert('음성 녹음을 지원하지 않는 브라우저입니다.');
          console.error('No supported MIME type found for MediaRecorder.');
          return;
        }
        
        setActualMimeType(supportedMimeType); // 실제 사용될 MIME 타입 저장
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: supportedMimeType });
        audioChunksRef.current = [];
        
        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorderRef.current.onstop = async () => {
          // Blob 생성 시 'actualMimeType' 사용
          const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType || 'audio/octet-stream' });
          setRecordedAudio(audioBlob);
          
          // 기존 Object URL 해제 (메모리 누수 방지)
          if (audioURL) {
            URL.revokeObjectURL(audioURL);
          }
          const newUrl = URL.createObjectURL(audioBlob);
          setAudioURL(newUrl);
          console.log("Audio Blob created:", audioBlob, "URL:", newUrl, "MIME Type:", actualMimeType);
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        setPronunciationScore(null); 
        if(audioURL) URL.revokeObjectURL(audioURL); 
        setAudioURL(''); 
        setRecordedAudio(null); 

      } catch (err) {
        console.error('녹음 시작 실패:', err);
        alert('마이크 접근 권한이 필요합니다. 브라우저 설정을 확인해주세요.');
      }
    } else {
      if (mediaRecorderRef.current?.state !== 'inactive') {
        mediaRecorderRef.current?.stop();
        // 스트림 트랙 중지는 MediaRecorder.onstop 이후 또는 resetRecording 시 처리하는 것이 더 안전할 수 있음
        // 여기서는 stop()만 호출하고, 스트림은 필요시 resetRecording에서 정리
      }
      setIsRecording(false);
    }
  };

   const handleAnalyzeWithAI = async () => {
    if (!recordedAudio) {
      alert('분석할 오디오 파일이 없습니다.');
      return;
    }
    setIsAnalyzing(true);
    setPronunciationScore(null); 

    const formData = new FormData();
    // 파일 확장자는 실제 녹음된 MIME 타입(actualMimeType)을 따르는 것이 좋음
    const fileExtension = actualMimeType.split(';')[0].split('/')[1] || 'bin'; // 'bin'은 일반적인 이진 파일 확장자
    formData.append('audioFile', recordedAudio, `recording.${fileExtension}`);
    console.log("Sending to backend:", `recording.${fileExtension}`, "MIME Type:", actualMimeType);


    try {
      const response = await fetch('http://localhost:8080/api/analyze-pronunciation', { 
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = `AI 분석 요청 실패: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMsg = `${errorMsg} - ${errorData.message || response.statusText || '서버 응답 오류'}`;
        } catch (e) { 
            errorMsg = `${errorMsg} - ${response.statusText || '서버 응답 오류'}`;
        }
        throw new Error(errorMsg); 
      }

      const result: PronunciationScore = await response.json();
      setPronunciationScore(result);

    } catch (error: unknown) { 
      console.error('AI 분석 중 오류 상세:', error); 
      
      let errorMessageToAlert = 'AI 분석 중 오류가 발생했습니다.';
      if (error instanceof Error) {
        errorMessageToAlert = error.message; 
      } else if (typeof error === 'string') {
        errorMessageToAlert = `${errorMessageToAlert}: ${error}`;
      }
      alert(errorMessageToAlert);
      setPronunciationScore(null); 
    } finally {
      setIsAnalyzing(false);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current && audioURL) { // audioURL이 유효한지 확인
      console.log("Toggle playback. Current state:", isPlaying, "Audio URL:", audioURL, "Audio Element:", audioRef.current);
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => {
          console.error('오디오 재생 오류:', error);
          // 사용자에게 재생 실패를 알릴 수 있습니다. (예: alert 또는 UI 메시지)
          alert('오디오를 재생할 수 없습니다. 파일 형식을 확인하거나 다시 시도해주세요.');
          setIsPlaying(false); // 재생 실패 시 isPlaying 상태를 false로 복원
        });
      }
      setIsPlaying(!isPlaying);
    } else {
        console.warn("Playback attempt with no audioRef or audioURL. Audio Ref:", audioRef.current, "Audio URL:", audioURL);
    }
  };

  const resetRecording = () => {
    if (isRecording && mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop(); // 녹음 중이면 중지
    }
    mediaRecorderRef.current?.stream?.getTracks().forEach(track => track.stop()); // 스트림 트랙 정리

    if (audioURL) {
        URL.revokeObjectURL(audioURL);
        console.log("Revoked Object URL:", audioURL);
    }
    setRecordedAudio(null);
    setAudioURL('');
    setPronunciationScore(null);
    setIsPlaying(false);
    setIsAnalyzing(false);
    setActualMimeType('');
    audioChunksRef.current = []; // 청크도 초기화
    console.log("Recording reset.");
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#22c55e';
    if (score >= 80) return '#3b82f6';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🎉';
    if (score >= 80) return '👍';
    if (score >= 70) return '💪';
    return '📚';
  };

  const HomePage = () => (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #F1EFEC, #D4C9BE)' }}>
      <div className="relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: '#123458' }}></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: '#D4C9BE' }}></div>
        <div className="relative z-10 px-3 py-2 max-w-md mx-auto">
          <header>
            <div className="text-left mb-6">
              <img src={logo} alt="따라톡 로고" className="h-20 w-auto -ml-4"/>
              <p className="text-[#030303] opacity-80">AI와 함께하는 영어 발음 학습</p>
            </div>
          </header>
          <div className="space-y-4 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg transform transition-all hover:scale-[1.02]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#123458] to-[#1e4d7b] rounded-2xl flex items-center justify-center shadow-md">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div><h3 className="font-semibold text-[#030303] mb-1">실시간 AI 분석</h3><p className="text-sm text-[#030303] opacity-70">녹음 즉시 정확한 발음 평가</p></div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg transform transition-all hover:scale-[1.02]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#D4C9BE] to-[#b8a699] rounded-2xl flex items-center justify-center shadow-md">
                  <Target className="w-7 h-7 text-[#123458]" />
                </div>
                <div><h3 className="font-semibold text-[#030303] mb-1">맞춤형 피드백</h3><p className="text-sm text-[#030303] opacity-70">한국인 특화 발음 개선 가이드</p></div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg transform transition-all hover:scale-[1.02]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#030303] to-[#2a2a2a] rounded-2xl flex items-center justify-center shadow-md">
                  <Sparkles className="w-7 h-7 text-[#F1EFEC]" />
                </div>
                <div><h3 className="font-semibold text-[#030303] mb-1">게임처럼 재미있게</h3><p className="text-sm text-[#030303] opacity-70">점수와 레벨로 동기부여 UP</p></div>
              </div>
            </div>
          </div>
          <button onClick={() => setCurrentPage('recording')} className="w-full bg-gradient-to-r from-[#123458] to-[#1e4d7b] text-[#F1EFEC] py-5 rounded-2xl font-semibold text-lg shadow-xl transform transition-all active:scale-95 hover:shadow-2xl flex items-center justify-center gap-3">
            <span>발음 연습 시작</span><ChevronRight className="w-6 h-6" />
          </button>
          <p className="text-center text-sm text-[#030303] opacity-50 mt-6">매일 5분, 완벽한 영어 발음을 향해 🚀</p>
        </div>
      </div>
    </div>
  );

  const RecordingPage = () => {
    const handleDownload = () => {
      if (audioURL && recordedAudio) {
        const link = document.createElement('a');
        link.href = audioURL;
        // 다운로드 시 파일 확장자는 실제 녹음된 MIME 타입(actualMimeType)을 따름
        const mimeTypeToUse = actualMimeType || recordedAudio.type;
        let extension = 'bin'; // 기본 확장자
        if (mimeTypeToUse) {
          const parts = mimeTypeToUse.split(';')[0].split('/');
          if (parts.length > 1 && parts[1]) {
            // 'x-wav' 같은 경우 'wav'로, 'mpeg'는 'mp3'로 바꿔주는 등의 추가 처리 가능
            extension = parts[1].replace('x-', ''); // 예: 'x-wav' -> 'wav'
            if (extension === 'mpeg') extension = 'mp3';
          }
        }
        const timestamp = new Date().toISOString().replace(/:|\.|T|Z/g, '-').slice(0, -1);
        link.download = `따라톡-녹음-${timestamp}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('다운로드할 오디오 파일이 준비되지 않았습니다.');
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F1EFEC] to-[#D4C9BE]">
        <header className="bg-[#F1EFEC]/95 backdrop-blur-sm sticky top-0 z-20 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <h1 className="text-xl font-bold text-[#123458]">발음 연습</h1>
            <button onClick={() => { setCurrentPage('home'); resetRecording(); setSelectedSentence(''); }} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm active:scale-95">
              <Home className="w-5 h-5 text-[#123458]" />
            </button>
          </div>
        </header>
        <div className="px-6 py-4 max-w-md mx-auto">
          {!selectedSentence && (
            <div className="animate-fadeIn">
              <h2 className="text-lg font-semibold text-[#030303] mb-4">오늘은 어떤 문장을 연습할까요?</h2>
              <div className="space-y-3">
                {sampleSentences.map((sentence) => (
                  <button key={sentence.id} onClick={() => setSelectedSentence(sentence.text)} className="w-full bg-white/90 backdrop-blur-sm rounded-2xl p-5 text-left transform transition-all active:scale-[0.98] hover:shadow-lg group">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: sentence.difficulty === '초급' ? '#D4C9BE' : sentence.difficulty === '중급' ? '#123458' : '#030303', color: sentence.difficulty === '초급' ? '#030303' : '#F1EFEC' }}>{sentence.difficulty}</span>
                      <span className="text-[10px] text-[#030303] opacity-60">{sentence.category}</span>
                    </div>
                    <p className="text-[15px] text-[#030303] leading-relaxed group-hover:text-[#123458] transition-colors">{sentence.text}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedSentence && (
            <div className="animate-fadeIn">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 mb-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-[#123458]">연습 문장</span>
                  {!isRecording && !audioURL && !isAnalyzing && (
                    <button onClick={() => { setSelectedSentence(''); resetRecording(); }} className="text-xs text-[#030303] opacity-60 hover:opacity-100">다른 문장 선택</button>
                  )}
                </div>
                <p className="text-lg font-medium text-[#030303] leading-relaxed">{selectedSentence}</p>
              </div>

              {isAnalyzing ? ( 
                <div className="text-center py-12">
                  <div className="w-10 h-10 border-4 border-[#123458] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-[#030303] font-medium">AI가 발음을 분석하고 있어요...</p>
                  <p className="text-sm text-[#030303] opacity-70">잠시만 기다려 주세요.</p>
                </div>
              ) : pronunciationScore ? ( 
                <div className="animate-slideUp">
                  <div className="text-center mb-6">
                    <div className="inline-block">
                      <div className="w-36 h-36 rounded-full flex items-center justify-center shadow-2xl mx-auto" style={{background: `conic-gradient(${getScoreColor(pronunciationScore.overall)} ${pronunciationScore.overall * 3.6}deg, #e5e5e5 0deg)`}}>
                        <div className="w-28 h-28 bg-white rounded-full flex flex-col items-center justify-center">
                          <span className="text-4xl font-bold" style={{ color: getScoreColor(pronunciationScore.overall) }}>{pronunciationScore.overall}</span>
                          <span className="text-xs text-[#030303] opacity-60">종합점수</span>
                        </div>
                      </div>
                      <p className="mt-3 text-2xl">{getScoreEmoji(pronunciationScore.overall)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center"><p className="text-xs text-[#030303] opacity-60 mb-1">조음 정확도</p><p className="text-2xl font-bold" style={{ color: getScoreColor(pronunciationScore.articulation) }}>{pronunciationScore.articulation}</p></div>
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center"><p className="text-xs text-[#030303] opacity-60 mb-1">운율 & 억양</p><p className="text-2xl font-bold" style={{ color: getScoreColor(pronunciationScore.prosody) }}>{pronunciationScore.prosody}</p></div>
                  </div>
                  <div className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-lg mb-6">
                    <h3 className="font-semibold text-[#030303] mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#123458]" />AI 피드백</h3>
                    <p className="text-sm text-[#030303] leading-relaxed">전반적으로 좋은 발음이에요! 특히 자음 발음이 정확합니다. 문장의 리듬감을 더 살리면 원어민처럼 자연스러운 발음이 될 거예요. 'conference'의 강세를 첫 음절에 두는 것을 잊지 마세요!</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { resetRecording(); setPronunciationScore(null); }} className="flex-1 bg-white py-3 rounded-2xl font-medium text-[#123458] shadow-sm active:scale-95">다시 연습하기</button>
                    <button onClick={() => { setSelectedSentence(''); resetRecording(); setPronunciationScore(null); }} className="flex-1 bg-gradient-to-r from-[#123458] to-[#1e4d7b] py-3 rounded-2xl font-medium text-[#F1EFEC] shadow-sm active:scale-95">다른 문장 연습</button>
                  </div>
                </div>
              ) : audioURL ? ( 
                <div className="mt-4 bg-transparent rounded-2xl p-1 max-w-md mx-auto"> 
                  {/* controls 속성 추가하여 브라우저 기본 컨트롤러 사용 (디버깅 및 사용자 편의) */}
                  <audio ref={audioRef} src={audioURL} onEnded={() => setIsPlaying(false)} className="w-full mb-4" controls />
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <button onClick={togglePlayback} className="flex-1 flex items-center justify-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-sm active:scale-95">
                        {isPlaying ? <Pause className="w-5 h-5 text-[#123458]" /> : <Play className="w-5 h-5 text-[#123458]" />}
                        <span className="text-sm font-medium text-[#123458]">{isPlaying ? '일시정지' : '들어보기'}</span>
                      </button>
                      <button onClick={resetRecording} className="flex-1 flex items-center justify-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-sm active:scale-95">
                        <RefreshCw className="w-5 h-5 text-[#030303]" />
                        <span className="text-sm font-medium text-[#030303]">다시 녹음</span>
                      </button>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl shadow-sm active:scale-95 border border-gray-300">
                          <Download className="w-5 h-5" />
                          <span className="text-sm font-medium">저장</span>
                        </button>
                      <button onClick={handleAnalyzeWithAI} className="flex-1 bg-gradient-to-r from-[#123458] to-[#1e4d7b] text-white px-4 py-2.5 rounded-xl shadow-lg active:scale-95 flex items-center justify-center gap-2 hover:shadow-xl">
                        <Sparkles className="w-5 h-5" />
                        <span className="text-sm font-medium">AI 분석하기</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : ( 
                <div className="text-center py-12">
                  <div className="relative inline-block">
                    {isRecording && (<div className="absolute inset-0 bg-[#123458] rounded-full animate-ping opacity-20"></div>)}
                    <button onClick={toggleRecording} disabled={isAnalyzing} className={`relative w-32 h-32 rounded-full shadow-2xl transform transition-all active:scale-95 ${isAnalyzing ? 'opacity-50' : ''}`} style={{ background: isRecording ? 'linear-gradient(135deg, #030303 0%, #2a2a2a 100%)' : 'linear-gradient(135deg, #123458 0%, #1e4d7b 100%)'}}>
                      {isAnalyzing ? (<div className="w-8 h-8 border-3 border-[#F1EFEC] border-t-transparent rounded-full animate-spin mx-auto"></div>) : isRecording ? (<MicOff className="w-12 h-12 text-[#F1EFEC] mx-auto" />) : (<Mic className="w-12 h-12 text-[#F1EFEC] mx-auto" />)}
                    </button>
                  </div>
                  <p className="mt-6 text-[#030303] font-medium">{isRecording ? `녹음 중... ${recordingTime}초` : '버튼을 눌러 녹음을 시작하세요'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return currentPage === 'home' ? <HomePage /> : <RecordingPage />;
};

export default App;