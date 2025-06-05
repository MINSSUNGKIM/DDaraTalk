package com.ai.ddaratalk.api.pronunciation;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.ai.ddaratalk.api.pronunciation.dto.PronunciationResult;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/pronunciation")
@RequiredArgsConstructor
@Slf4j
public class PronunciationController {

	private final AudioConversionService audioConversionService;
	private final PronunciationAnalysisService pronunciationAnalysisService;

	@PostMapping("/analyze")
	public ResponseEntity<?> analyzePronunciation(
		@RequestParam("audioFile") MultipartFile audioFile,
		@RequestParam(value = "lang", defaultValue = "en") String lang,
		@RequestParam(value = "text", required = false) String targetText) {

		try {
			log.info("발음 분석 요청 수신: 파일명={}, 언어={}", audioFile.getOriginalFilename(), lang);

			// 1. 입력 검증
			if (audioFile.isEmpty()) {
				return ResponseEntity.badRequest()
					.body(new ErrorResponse("업로드된 파일이 비어있습니다."));
			}

			// 2. WebM을 WAV로 변환
			String wavFilePath = audioConversionService.convertWebmToWav(audioFile);
			log.info("오디오 변환 완료: {}", wavFilePath);

			// 3. AI 모델을 통한 발음 분석
			PronunciationResult result = pronunciationAnalysisService.analyzePronunciation(
				wavFilePath, lang, targetText);

			log.info("발음 분석 완료: 점수={}", result.getScore());

			// 4. 임시 파일 정리
			audioConversionService.cleanupTempFile(wavFilePath);

			return ResponseEntity.ok(result);

		} catch (IOException | InterruptedException e) {
			log.error("오디오 변환 중 오류 발생", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(new ErrorResponse("오디오 파일 처리 중 오류가 발생했습니다."));
		} catch (Exception e) {
			log.error("발음 분석 중 예상치 못한 오류 발생", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(new ErrorResponse("발음 분석 중 오류가 발생했습니다: " + e.getMessage()));
		}
	}

	/**
	 * 에러 응답 DTO
	 */
	public static class ErrorResponse {
		private String error;
		private long timestamp;

		public ErrorResponse(String error) {
			this.error = error;
			this.timestamp = System.currentTimeMillis();
		}

		public String getError() { return error; }
		public long getTimestamp() { return timestamp; }
	}
}