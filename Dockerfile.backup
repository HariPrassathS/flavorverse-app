# Use Eclipse Temurin (AdoptOpenJDK) for better compatibility
FROM eclipse-temurin:17-jdk-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the Maven wrapper and pom.xml file to download dependencies
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Make mvnw executable
RUN chmod +x ./mvnw

# Download all dependencies
RUN ./mvnw dependency:go-offline -B

# Copy the rest of the application source code
COPY src ./src

# Build the application's JAR file
RUN ./mvnw clean package -DskipTests

# Expose the port the app runs on
EXPOSE 8080

# The command to run the application (use $PORT for Railway)
CMD java -Dserver.port=${PORT:-8080} -jar target/flavorverse-0.0.1-SNAPSHOT.jar