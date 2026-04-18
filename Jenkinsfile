pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
    }

    tools {
        nodejs 'nodejs'
    }

    environment {
        SONAR_TOKEN = credentials('sonar-token')
        CHROME_BIN = '/usr/bin/chromium'
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/Esprit-PI-4TWIN2-2526-MediFollow/Esprit-FullStackJS-4Twin2-2526-FrontEnd_Medifollow.git'
            }
        }

        stage('Install') {
            steps {
                sh 'npm install --legacy-peer-deps'
            }
        }

        stage('Test & Coverage') {
            steps {
                sh '''
                set -eux

                echo "Using Chrome: $CHROME_BIN"
                $CHROME_BIN --version || true

                npm run test:cov -- --watch=false --browsers=ChromeHeadlessNoSandbox
                '''
            }
        }

        stage('SonarQube') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    script {
                        def scannerHome = tool 'sonar-scanner'
                        sh """
                        ${scannerHome}/bin/sonar-scanner \
                        -Dsonar.projectKey=MediFollow-Frontend \
                        -Dsonar.sources=src \
                        -Dsonar.host.url=http://sonarqube:9000 \
                        -Dsonar.login=$SONAR_TOKEN \
                        -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }
}