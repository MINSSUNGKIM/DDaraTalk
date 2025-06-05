package com.ai.ddaratalk.api.pronunciation;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AudioConversionService {

	private static final Logger logger = LoggerFactory.getLogger(AudioConversionService.class);

	@Value("${app.shared.directory:/tmp/shared_data}")
	private String sharedDirectory;

	private static final String TEMP_DIR = System.getProperty("java.io.tmpdir");

	/**
	 * WebM 파일을 WAV로 변환하고 공유 폴더로 이동
	 * @param webmFile 업로드된 WebM 파일
	 * @return 공유 폴더 내 WAV 파일 경로
	 */
	public String convertWebmToWav(MultipartFile webmFile) throws IOException, InterruptedException {
		// FFmpeg 설치 확인
		checkFFmpegInstallation();

		// 공유 폴더 생성
		createSharedDirectories();

		// 임시 파일 생성
		String uuid = UUID.randomUUID().toString();
		Path tempWebmPath = Paths.get(TEMP_DIR, uuid + ".webm");
		Path tempWavPath = Paths.get(TEMP_DIR, uuid + ".wav");

		// 절대 경로로 공유 폴더 경로 구성
		Path sharedWavPath = Paths.get(sharedDirectory, "input", uuid + ".wav").toAbsolutePath();

		try {
			// WebM 파일을 임시 디렉토리에 저장
			Files.copy(webmFile.getInputStream(), tempWebmPath, StandardCopyOption.REPLACE_EXISTING);
			logger.info("WebM 파일 저장 완료: {}", tempWebmPath);

			// FFmpeg로 변환 실행
			executeFFmpegConversion(tempWebmPath.toString(), tempWavPath.toString());

			// WAV 파일을 공유 폴더로 이동
			Files.move(tempWavPath, sharedWavPath, StandardCopyOption.REPLACE_EXISTING);

			logger.info("WAV 변환 및 공유 폴더 이동 완료: {}", sharedWavPath);
			return sharedWavPath.toString();

		} finally {
			// 임시 파일들 정리
			cleanupTempFiles(tempWebmPath, tempWavPath);
		}
	}

	/**
	 * 공유 디렉토리 생성
	 */
	private void createSharedDirectories() throws IOException {
		Path inputDir = Paths.get(sharedDirectory, "input").toAbsolutePath();
		Path outputDir = Paths.get(sharedDirectory, "output").toAbsolutePath();

		logger.info("공유 디렉토리 절대 경로 - Input: {}, Output: {}", inputDir, outputDir);

		Files.createDirectories(inputDir);
		Files.createDirectories(outputDir);

		logger.info("공유 디렉토리 생성 완료: input={}, output={}", inputDir, outputDir);

		// 디렉토리 존재 여부 재확인
		logger.info("디렉토리 존재 확인 - Input: {}, Output: {}",
			Files.exists(inputDir), Files.exists(outputDir));
	}

	/**
	 * FFmpeg 명령어 실행
	 */
	private void executeFFmpegConversion(String inputPath, String outputPath)
		throws IOException, InterruptedException {

		List<String> command = new ArrayList<>();
		command.add("ffmpeg");
		command.add("-i");
		command.add(inputPath);
		command.add("-acodec");
		command.add("pcm_s16le");     // 16-bit PCM (AI 모델 호환)
		command.add("-ar");
		command.add("16000");         // 16kHz 샘플링 레이트 (AI 모델 최적화)
		command.add("-ac");
		command.add("1");             // 모노 채널
		command.add("-y");            // 덮어쓰기 허용
		command.add(outputPath);

		ProcessBuilder processBuilder = new ProcessBuilder(command);
		processBuilder.redirectErrorStream(true);

		logger.info("FFmpeg 명령어 실행: {}", String.join(" ", command));

		Process process = processBuilder.start();

		// FFmpeg 출력 로깅
		try (BufferedReader reader = new BufferedReader(
			new InputStreamReader(process.getInputStream()))) {
			String line;
			while ((line = reader.readLine()) != null) {
				logger.debug("FFmpeg: {}", line);
			}
		}

		int exitCode = process.waitFor();
		if (exitCode != 0) {
			throw new RuntimeException("FFmpeg 변환 실패. Exit code: " + exitCode);
		}
	}

	/**
	 * FFmpeg 설치 확인
	 */
	private void checkFFmpegInstallation() {
		try {
			ProcessBuilder pb = new ProcessBuilder("ffmpeg", "-version");
			Process process = pb.start();
			int exitCode = process.waitFor();

			if (exitCode != 0) {
				throw new RuntimeException("FFmpeg가 올바르게 설치되지 않았습니다.");
			}

		} catch (IOException | InterruptedException e) {
			throw new RuntimeException("FFmpeg가 설치되지 않았습니다. " +
				"Ubuntu: 'apt install ffmpeg', macOS: 'brew install ffmpeg'로 설치해주세요.", e);
		}
	}

	/**
	 * 임시 파일들 정리
	 */
	private void cleanupTempFiles(Path... paths) {
		for (Path path : paths) {
			try {
				if (Files.exists(path)) {
					Files.deleteIfExists(path);
					logger.debug("임시 파일 삭제 완료: {}", path);
				}
			} catch (IOException e) {
				logger.warn("임시 파일 삭제 실패: {}", path, e);
			}
		}
	}

	/**
	 * 임시 파일 정리 (외부 호출용)
	 * @param filePath 삭제할 파일 경로
	 */
	public void cleanupTempFile(String filePath) {
		try {
			Files.deleteIfExists(Paths.get(filePath));
			logger.info("파일 삭제 완료: {}", filePath);
		} catch (IOException e) {
			logger.warn("파일 삭제 실패: {}", filePath, e);
		}
	}

	/**
	 * 파일 확장자를 제거한 파일명 반환
	 * @param filePath 파일 경로
	 * @return 확장자를 제거한 파일명
	 */
	public String getFileNameWithoutExtension(String filePath) {
		Path path = Paths.get(filePath);
		String fileName = path.getFileName().toString();
		int lastDotIndex = fileName.lastIndexOf('.');
		return lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
	}
}