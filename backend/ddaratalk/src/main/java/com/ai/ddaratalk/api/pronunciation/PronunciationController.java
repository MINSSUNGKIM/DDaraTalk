package com.ai.ddaratalk.api.pronunciation;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/pronunciation") // 컨트롤러의 기본 경로 설정
public class PronunciationController {

	@PostMapping("/analyze")
	public ResponseEntity<String> analyzePronunciation(@RequestParam("audioFile") MultipartFile audioFile) {
		// 1. 파일 수신 확인 로그
		System.out.println("컨트롤러에 오디오 파일 수신됨!");
		System.out.println("원본 파일 이름: " + audioFile.getOriginalFilename());
		System.out.println("파일 크기: " + audioFile.getSize() + " bytes");
		System.out.println("파일 컨텐츠 타입: " + audioFile.getContentType());

		// 2. 실제 분석 로직 (추후 구현)
		// TODO: 오디오 파일 저장 (임시 또는 영구)
		// TODO: FFmpeg를 사용하여 WAV로 변환 (필요시)
		// TODO: Python AI 스크립트 호출
		// TODO: AI 스크립트 결과 파싱

		// 3. 임시 응답
		String responseMessage = "오디오 파일 '" + audioFile.getOriginalFilename() + "' 수신 완료. 분석 기능은 준비 중입니다.";
		System.out.println("클라이언트에 응답: " + responseMessage);

		return ResponseEntity.ok(responseMessage);
	}

	// (선택적) 간단한 GET 요청 테스트용 엔드포인트
	// @GetMapping("/ping")
	// public ResponseEntity<String> ping() {
	//     String message = "PronunciationController is active!";
	//     System.out.println(message);
	//     return ResponseEntity.ok(message);
	// }
}