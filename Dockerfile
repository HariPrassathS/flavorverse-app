# Use a standard Java 17 base image
FROM openjdk:17-jdk-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the Maven wrapper and pom.xml file to download dependencies
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Download all dependencies
RUN ./mvnw dependency:go-offline

# Copy the rest of the application source code
COPY src ./src

# Build the application's JAR file
RUN ./mvnw clean package -DskipTests

# Expose the port the app runs on
EXPOSE 8080

# The command to run the application
CMD java -jar target/flavorverse-0.0.1-SNAPSHOT.jar