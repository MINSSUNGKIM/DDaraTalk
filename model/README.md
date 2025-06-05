## 📥 설치 방법

### 1. AI Hub 모델 다운로드
1. [AI Hub 발음평가 데이터](https://www.aihub.or.kr/aihubdata/data/view.do?pageIndex=2&currMenu=115&topMenu=100&srchOptnCnd=OPTNCND001&searchKeyword=&srchDetailCnd=DETAILCND001&srchOrder=ORDER001&srchPagePer=20&srchDataRealmCode=REALM010&aihubDataSe=data&dataSetSn=71463) 접속
2. 회원가입 후 `nia_pron.tar.gz` 다운로드
3. 프로젝트 루트에 저장

### 2. Docker 환경 설정
```bash
# Docker 이미지 로드
docker load -i nia_pron.tar.gz

# 컨테이너 실행
docker run -d --name nia_pron_container \
  -v $(pwd)/shared_data:/data/shared \
  --gpus all --shm-size 10gb \
  nia_012_pron tail -f /dev/null