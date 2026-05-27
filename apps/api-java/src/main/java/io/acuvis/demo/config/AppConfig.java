package io.acuvis.demo.config;

import io.acuvis.demo.auth.AuthInterceptor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableConfigurationProperties(AppProperties.class)
public class AppConfig implements WebMvcConfigurer {

    private final AppProperties props;
    private final AuthInterceptor authInterceptor;

    public AppConfig(AppProperties props, AuthInterceptor authInterceptor) {
        this.props = props;
        this.authInterceptor = authInterceptor;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // Strong work factor for user passwords. Link gate passwords use a
        // separate (cheaper) hasher — see LinkPasswordHasher.
        return new BCryptPasswordEncoder(12);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(props.cors().origins().toArray(new String[0]))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/links/**")
                .excludePathPatterns("/links/*/redirect");
    }
}
