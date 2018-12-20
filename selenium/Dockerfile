FROM selenium/standalone-chrome:3.141.59

USER root

RUN apt-get update && apt-get install -y maven openjdk-8-jdk-headless && apt-get clean

USER seluser

ENV JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64

CMD ['mvn', 'clean', 'test']