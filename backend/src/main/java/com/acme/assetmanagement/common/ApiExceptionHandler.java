package com.acme.assetmanagement.common;

import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class ApiExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException exception) {
        return body(HttpStatus.FORBIDDEN, "没有执行此操作的权限");
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApi(ApiException exception) {
        return body(exception.getStatus(), exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .map(DefaultMessageSourceResolvable::getDefaultMessage)
                .collect(Collectors.joining("；"));
        return body(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadableRequest(HttpMessageNotReadableException exception) {
        return body(HttpStatus.BAD_REQUEST, "请求数据格式不正确");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(Exception exception) {
        log.error("Unexpected server error", exception);
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "服务器处理失败，请稍后重试");
    }

    private ResponseEntity<Map<String, Object>> body(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of(
                "status", status.value(),
                "message", message,
                "timestamp", LocalDateTime.now().toString()
        ));
    }
}
