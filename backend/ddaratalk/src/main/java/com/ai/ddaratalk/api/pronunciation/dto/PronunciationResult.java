package com.ai.ddaratalk.api.pronunciation.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 발음 분석 결과 DTO
 */
@Data
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PronunciationResult {

	/**
	 * 발음 점수 (0.0 ~ 5.0)
	 */
	private Double score;

	/**
	 * 운율(prosody) 점수 (0.0 ~ 5.0)
	 */
	private Double prosodyScore;

	/**
	 * 처리 시간 (타임스탬프)
	 */
	private Long timestamp;

	/**
	 * 처리 상태 ("success", "error")
	 */
	private String status;

	/**
	 * 에러 메시지 (에러 발생 시)
	 */
	private String error;

	/**
	 * STT 결과 (음성을 텍스트로 변환한 결과)
	 */
	private String transcription;

	/**
	 * 목표 텍스트 (사용자가 읽으려고 했던 텍스트)
	 */
	private String targetText;

	/**
	 * 단어별 정확도 분석 결과
	 */
	private List<WordAccuracy> wordAccuracies;

	/**
	 * 추가 분석 정보
	 */
	private AnalysisDetails analysisDetails;

	/**
	 * 단어별 정확도 정보
	 */
	@Data
	@NoArgsConstructor
	@JsonInclude(JsonInclude.Include.NON_NULL)
	public static class WordAccuracy {
		/**
		 * 단어
		 */
		private String word;

		/**
		 * 예상 발음 (목표)
		 */
		private String expectedPronunciation;

		/**
		 * 실제 발음 (STT 결과)
		 */
		private String actualPronunciation;

		/**
		 * 정확도 점수 (0.0 ~ 1.0)
		 */
		private Double accuracy;

		/**
		 * 발음 상태 ("correct", "incorrect", "missing", "extra")
		 */
		private String status;

		/**
		 * 개선 제안
		 */
		private String suggestion;
	}

	/**
	 * 상세 분석 정보
	 */
	@Data
	@NoArgsConstructor
	@JsonInclude(JsonInclude.Include.NON_NULL)
	public static class AnalysisDetails {
		/**
		 * 전체 단어 수
		 */
		private Integer totalWords;

		/**
		 * 정확한 단어 수
		 */
		private Integer correctWords;

		/**
		 * 단어 정확도 비율 (0.0 ~ 1.0)
		 */
		private Double wordAccuracyRate;

		/**
		 * 발음 명료도 점수
		 */
		private Double clarityScore;

		/**
		 * 유창성 점수
		 */
		private Double fluencyScore;

		/**
		 * 처리 시간 (밀리초)
		 */
		private Long processingTime;

		/**
		 * 사용된 AI 모델 정보
		 */
		private String modelInfo;

		/**
		 * 언어 코드
		 */
		private String language;

		/**
		 * 오디오 정보
		 */
		private AudioInfo audioInfo;
	}

	/**
	 * 오디오 파일 정보
	 */
	@Data
	@NoArgsConstructor
	@JsonInclude(JsonInclude.Include.NON_NULL)
	public static class AudioInfo {
		/**
		 * 오디오 길이 (초)
		 */
		private Double duration;

		/**
		 * 샘플링 레이트
		 */
		private Integer sampleRate;

		/**
		 * 채널 수
		 */
		private Integer channels;

		/**
		 * 오디오 품질 점수 (0.0 ~ 1.0)
		 */
		private Double qualityScore;
	}

	/**
	 * 성공적인 결과인지 확인
	 */
	public boolean isSuccess() {
		return "success".equals(status) && score != null;
	}

	/**
	 * 에러 발생 여부 확인
	 */
	public boolean hasError() {
		return "error".equals(status) || error != null;
	}

	/**
	 * 점수를 백분율로 변환 (0-100)
	 */
	public Double getScoreAsPercentage() {
		return score != null ? (score / 5.0) * 100.0 : null;
	}

	/**
	 * 점수 등급 반환 (A, B, C, D, F)
	 */
	public String getScoreGrade() {
		if (score == null) return null;

		if (score >= 4.5) return "A";
		else if (score >= 3.5) return "B";
		else if (score >= 2.5) return "C";
		else if (score >= 1.5) return "D";
		else return "F";
	}

	/**
	 * 빌더 패턴 지원
	 */
	public static PronunciationResult success(double score) {
		PronunciationResult result = new PronunciationResult();
		result.setScore(score);
		result.setStatus("success");
		result.setTimestamp(System.currentTimeMillis());
		return result;
	}

	public static PronunciationResult error(String errorMessage) {
		PronunciationResult result = new PronunciationResult();
		result.setStatus("error");
		result.setError(errorMessage);
		result.setTimestamp(System.currentTimeMillis());
		return result;
	}
}