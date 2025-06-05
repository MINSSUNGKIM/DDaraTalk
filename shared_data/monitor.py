#!/usr/bin/env python3
import os
import json
import time
import glob
import sys
import traceback

sys.path.append('/data/project/nia/pron')

SHARED_INPUT_PATH = "/data/project/shared_data/input/"
SHARED_OUTPUT_PATH = "/data/project/shared_data/output/"

def log_message(message):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

def analyze_pronunciation_simple(wav_path, lang='en'):
    """간단한 발음 분석 (테스트용)"""
    try:
        log_message(f"발음 분석: {wav_path}")
        import random
        # 실제 파일 크기 기반 점수 생성
        if os.path.exists(wav_path):
            file_size = os.path.getsize(wav_path)
            # 파일 크기에 따라 점수 조정 (2.0 ~ 4.5)
            score = min(4.5, max(2.0, (file_size / 50000) + random.uniform(1.8, 3.2)))
        else:
            score = random.uniform(2.0, 4.0)
        
        return score
    except Exception as e:
        log_message(f"분석 중 오류: {e}")
        return 2.5

def process_requests():
    log_message("모니터링 시작...")
    
    # 디렉토리 생성
    os.makedirs(SHARED_OUTPUT_PATH, exist_ok=True)
    
    while True:
        try:
            request_files = glob.glob(SHARED_INPUT_PATH + "*.request")
            
            for request_file in request_files:
                try:
                    log_message(f"요청 파일 발견: {request_file}")
                    
                    with open(request_file, 'r') as f:
                        request_data = json.load(f)
                    
                    wav_file = request_data['wav_file']
                    wav_path = SHARED_INPUT_PATH + wav_file
                    lang = request_data.get('lang', 'en')
                    
                    if os.path.exists(wav_path):
                        start_time = time.time()
                        score = analyze_pronunciation_simple(wav_path, lang)
                        processing_time = time.time() - start_time
                        
                        result_file = SHARED_OUTPUT_PATH + wav_file + ".result"
                        result_data = {
                            "score": float(score),
                            "timestamp": time.time(),
                            "status": "success",
                            "language": lang,
                            "processing_time": processing_time
                        }
                        
                        with open(result_file, 'w') as f:
                            json.dump(result_data, f)
                        
                        log_message(f"결과 저장: {result_file}, 점수: {score}")
                    else:
                        log_message(f"WAV 파일 없음: {wav_path}")
                    
                    os.remove(request_file)
                    
                except Exception as e:
                    log_message(f"요청 처리 오류: {e}")
                    try:
                        error_result = {
                            "error": str(e),
                            "timestamp": time.time(),
                            "status": "error"
                        }
                        wav_file = request_data.get('wav_file', 'unknown')
                        error_file = SHARED_OUTPUT_PATH + wav_file + ".result"
                        with open(error_file, 'w') as f:
                            json.dump(error_result, f)
                        os.remove(request_file)
                    except:
                        pass
        
        except Exception as e:
            log_message(f"모니터링 루프 오류: {e}")
        
        time.sleep(1)

if __name__ == "__main__":
    process_requests()
