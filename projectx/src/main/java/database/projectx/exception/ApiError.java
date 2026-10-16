package database.projectx.exception;

import java.time.LocalDateTime;
import java.util.Map;

public record ApiError(
    LocalDateTime timestamp,
    int status,
    String erorr,
    String message,
    Map<String, String> details
){

}
