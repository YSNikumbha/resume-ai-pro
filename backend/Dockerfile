FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /workspace

COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN addgroup -S resumeai \
    && adduser -S resumeai -G resumeai \
    && mkdir -p /app/uploads/resumes \
    && chown -R resumeai:resumeai /app

COPY --from=build /workspace/target/*.jar /app/app.jar
RUN chown resumeai:resumeai /app/app.jar

USER resumeai

ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
