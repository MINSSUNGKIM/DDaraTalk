package com.ai.ddaratalk.common;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/**") // 애플리케이션의 모든 경로(/**)에 대해 CORS 설정 적용
			.allowedOrigins("http://localhost:5173") // 요청을 허용할 출처 (프론트엔드 Vite 개발 서버 주소)
			.allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD") // 허용할 HTTP 메소드 종류
			.allowedHeaders("*") // 모든 HTTP 헤더 허용
			.allowCredentials(true) // 쿠키와 같은 인증 정보 허용 여부
			.maxAge(3600); // Pre-flight 요청의 결과를 캐시할 시간 (초 단위)
	}
}