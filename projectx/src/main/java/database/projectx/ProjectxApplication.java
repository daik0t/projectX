package database.projectx;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

//TODO: приложение не стартанет без .env см ошибка 8 ponytail
//TODO: Схема бд не в git и миграций нет
//TODO: три переменных для фронта и ни одна не используется
@SpringBootApplication
public class ProjectxApplication {

	public static void main(String[] args) {
		SpringApplication.run(ProjectxApplication.class, args);
	}

}
