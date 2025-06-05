#!/usr/bin/env python3
import os
import json
import time
import glob
import sys
import traceback
import subprocess

sys.path.append('/data/project/nia/pron')

SHARED_INPUT_PATH = "/data/project/shared_data/input/"
SHARED_OUTPUT_PATH = "/data/project/shared_data/output/"

def log_message(message):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

def analyze_with_original_script(wav_path, lang='en'):
    """원본 AI Hub inference_wav.py 스크립트 직접 호출"""
    try:
        log_message(f"원본 AI Hub 스크립트 사용: {wav_path}")
        
        # 작업 디렉토리를 AI Hub 스크립트 위치로 변경
        original_cwd = os.getcwd()
        os.chdir('/data/project/nia/pron')
        
        # 원본 inference_wav.py 실행
        cmd = [
            'python', 'inference_wav.py',
            '--wav', wav_path,
            '--lang', lang,
            '--label_type1', 'pron',
            '--label_type2', 'articulation',
            '--device', 'cpu',
            '--dir_model', 'model'
        ]
        
        log_message(f"명령어 실행: {' '.join(cmd)}")
        
        # 프로세스 실행 및 결과 캡처
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60  # 60초 타임아웃
        )
        
        # 원래 작업 디렉토리로 복귀
        os.chdir(original_cwd)
        
        if result.returncode == 0:
            # stdout에서 score 추출
            output_lines = result.stdout.strip().split('\n')
            score_line = None
            
            for line in output_lines:
                if 'score:' in line:
                    score_line = line
                    break
            
            if score_line:
                try:
                    score = float(score_line.split('score:')[1].strip())
                    log_message(f"원본 스크립트 분석 완료: {score}")
                    return score
                except:
                    log_message(f"점수 파싱 실패: {score_line}")
                    return None
            else:
                log_message(f"점수를 찾을 수 없음. 출력: {result.stdout}")
                return None
        else:
            log_message(f"스크립트 실행 실패: {result.stderr}")
            return None
            
    except subprocess.TimeoutExpired:
        log_message("스크립트 실행 시간 초과")
        return None
    except Exception as e:
        log_message(f"원본 스크립트 실행 오류: {e}")
        log_message(traceback.format_exc())
        return None

def process_requests():
    log_message("=== 원본 AI Hub 스크립트 모니터링 시작 ===")
    os.makedirs(SHARED_OUTPUT_PATH, exist_ok=True)
    
    while True:
        try:
            request_files = glob.glob(SHARED_INPUT_PATH + "*.request")
            
            for request_file in request_files:
                try:
                    log_message(f"요청 파일 처리: {request_file}")
                    
                    with open(request_file, 'r') as f:
                        request_data = json.load(f)
                    
                    wav_file = request_data['wav_file']
                    wav_path = SHARED_INPUT_PATH + wav_file
                    lang = request_data.get('lang', 'en')
                    
                    if os.path.exists(wav_path):
                        start_time = time.time()
                        
                        # 원본 AI Hub 스크립트 사용
                        score = analyze_with_original_script(wav_path, lang)
                        
                        processing_time = time.time() - start_time
                        
                        result_file = SHARED_OUTPUT_PATH + wav_file + ".result"
                        
                        if score is not None:
                            result_data = {
                                "score": float(score),
                                "timestamp": time.time(),
                                "status": "success",
                                "language": lang,
                                "processing_time": processing_time,
                                "model_type": "original_ai_hub"
                            }
                            log_message(f"원본 AI 분석 결과: {score} (처리시간: {processing_time:.2f}초)")
                        else:
                            result_data = {
                                "error": "AI 분석 실패",
                                "timestamp": time.time(),
                                "status": "error",
                                "processing_time": processing_time
                            }
                            log_message(f"AI 분석 실패 (처리시간: {processing_time:.2f}초)")
                        
                        with open(result_file, 'w') as f:
                            json.dump(result_data, f, indent=2)
                    
                    os.remove(request_file)
                    
                except Exception as e:
                    log_message(f"요청 처리 오류: {e}")
        
        except Exception as e:
            log_message(f"모니터링 오류: {e}")
        
        time.sleep(1)

if __name__ == "__main__":
    process_requests()
