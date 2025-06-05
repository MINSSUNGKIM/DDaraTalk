package com.ai.ddaratalk.api.pronunciation;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.ai.ddaratalk.api.pronunciation.dto.PronunciationResult;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class PronunciationAnalysisService {

	private static final Logger logger = LoggerFactory.getLogger(PronunciationAnalysisService.class);

	@Value("${app.shared.directory:/tmp/shared_data}")
	private String sharedDirectory;

	@Value("${app.analysis.timeout:30}")
	private int analysisTimeoutSeconds;

	private final ObjectMapper objectMapper = new ObjectMapper();

	/**
	 * 발음 분석 수행
	 * @param wavFilePath WAV 파일 경로
	 * @param language 분석할 언어 (en, de, es, fr, jp, ru, zh)
	 * @param targetText 목표 텍스트 (선택적)
	 * @return 발음 분석 결과
	 */
	public PronunciationResult analyzePronunciation(String wavFilePath, String language, String targetText) {
		try {
			String fileName = extractFileName(wavFilePath);

			// 1. 분석 요청 파일 생성
			createAnalysisRequest(fileName, language, targetText);

			// 2. 결과 대기 및 읽기
			PronunciationResult result = waitForAnalysisResult(fileName);

			// 3. 요청/결과 파일 정리
			cleanupAnalysisFiles(fileName);

			return result;

		} catch (Exception e) {
			logger.error("발음 분석 중 오류 발생: {}", e.getMessage(), e);
			throw new RuntimeException("발음 분석 실패: " + e.getMessage(), e);
		}
	}

	/**
	 * 분석 요청 파일 생성
	 */
	private void createAnalysisRequest(String fileName, String language, String targetText) throws IOException {
		String requestFileName = fileName + ".request";
		Path requestFilePath = Paths.get(sharedDirectory, "input", requestFileName);

		Map<String, Object> requestData = new HashMap<>();
		requestData.put("wav_file", fileName + ".wav");
		requestData.put("lang", language);
		requestData.put("label_type1", "pron");
		requestData.put("label_type2", "articulation");
		requestData.put("timestamp", System.currentTimeMillis());

		if (targetText != null && !targetText.trim().isEmpty()) {
			requestData.put("target_text", targetText.trim());
		}

		objectMapper.writeValue(requestFilePath.toFile(), requestData);
		logger.info("분석 요청 파일 생성: {}", requestFilePath);
	}

	/**
	 * 분석 결과 대기 및 읽기
	 */
	private PronunciationResult waitForAnalysisResult(String fileName) {
		String resultFileName = fileName + ".wav.result";
		Path resultFilePath = Paths.get(sharedDirectory, "output", resultFileName);

		logger.info("분석 결과 대기 중: {}", resultFilePath);

		// 타임아웃까지 결과 파일 대기
		for (int i = 0; i < analysisTimeoutSeconds; i++) {
			if (Files.exists(resultFilePath)) {
				try {
					String resultJson = Files.readString(resultFilePath);
					logger.info("분석 결과 수신: {}", resultJson);

					// JSON 파싱하여 결과 객체 생성
					Map<String, Object> resultMap = objectMapper.readValue(resultJson, Map.class);

					if ("error".equals(resultMap.get("status"))) {
						throw new RuntimeException("AI 모델 분석 오류: " + resultMap.get("error"));
					}

					return createPronunciationResult(resultMap);

				} catch (IOException e) {
					logger.error("결과 파일 읽기 실패: {}", resultFilePath, e);
					throw new RuntimeException("결과 파일 읽기 실패", e);
				}
			}

			try {
				Thread.sleep(1000); // 1초 대기
			} catch (InterruptedException e) {
				Thread.currentThread().interrupt();
				throw new RuntimeException("분석 대기 중 인터럽트 발생", e);
			}
		}

		throw new RuntimeException("분석 시간 초과 (" + analysisTimeoutSeconds + "초)");
	}

	/**
	 * 결과 맵을 PronunciationResult 객체로 변환
	 */
	private PronunciationResult createPronunciationResult(Map<String, Object> resultMap) {
		PronunciationResult result = new PronunciationResult();

		// 기본 정보 설정
		result.setScore(getDoubleValue(resultMap, "score"));
		result.setTimestamp(getLongValue(resultMap, "timestamp"));
		result.setStatus((String) resultMap.get("status"));

		// 추가 정보가 있다면 설정
		if (resultMap.containsKey("transcription")) {
			result.setTranscription((String) resultMap.get("transcription"));
		}

		if (resultMap.containsKey("prosody_score")) {
			result.setProsodyScore(getDoubleValue(resultMap, "prosody_score"));
		}

		// 점수 검증 및 보정
		if (result.getScore() != null) {
			result.setScore(Math.max(0.0, Math.min(5.0, result.getScore())));
		}

		logger.info("발음 분석 결과 생성 완료: 점수={}", result.getScore());
		return result;
	}

	/**
	 * 분석 관련 파일들 정리
	 */
	private void cleanupAnalysisFiles(String fileName) {
		try {
			// 요청 파일 삭제
			Path requestFile = Paths.get(sharedDirectory, "input", fileName + ".request");
			Files.deleteIfExists(requestFile);

			// 결과 파일 삭제
			Path resultFile = Paths.get(sharedDirectory, "output", fileName + ".wav.result");
			Files.deleteIfExists(resultFile);

			logger.debug("분석 파일 정리 완료: {}", fileName);

		} catch (IOException e) {
			logger.warn("분석 파일 정리 실패: {}", fileName, e);
		}
	}

	/**
	 * 파일 경로에서 파일명 추출 (확장자 제외)
	 */
	private String extractFileName(String filePath) {
		Path path = Paths.get(filePath);
		String fileName = path.getFileName().toString();
		int lastDotIndex = fileName.lastIndexOf('.');
		return lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
	}

	/**
	 * Map에서 Double 값 안전하게 추출
	 */
	private Double getDoubleValue(Map<String, Object> map, String key) {
		Object value = map.get(key);
		if (value == null) return null;
		if (value instanceof Number) {
			return ((Number) value).doubleValue();
		}
		try {
			return Double.parseDouble(value.toString());
		} catch (NumberFormatException e) {
			logger.warn("Double 변환 실패: key={}, value={}", key, value);
			return null;
		}
	}

	/**
	 * Map에서 Long 값 안전하게 추출
	 */
	private Long getLongValue(Map<String, Object> map, String key) {
		Object value = map.get(key);
		if (value == null) return null;
		if (value instanceof Number) {
			return ((Number) value).longValue();
		}
		try {
			return Long.parseLong(value.toString());
		} catch (NumberFormatException e) {
			logger.warn("Long 변환 실패: key={}, value={}", key, value);
			return null;
		}
	}
}