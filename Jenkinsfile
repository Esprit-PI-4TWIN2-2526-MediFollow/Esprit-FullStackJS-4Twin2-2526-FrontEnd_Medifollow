pipeline {
    agent any
    tools {
        nodejs 'nodejs-18'
    }

    environment {
        SONAR_TOKEN = credentials('sonar-token')
        CHROME_BIN = '/usr/bin/google-chrome'
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/Esprit-PI-4TWIN2-2526-MediFollow/Esprit-FullStackJS-4Twin2-2526-FrontEnd_Medifollow.git'
            }
        }

        stage('Install') {
            steps {
                sh 'npm install'
            }
        }

        stage('Test & Coverage') {
            steps {
                sh 'npx ng test --code-coverage --watch=false --browsers=ChromeHeadless'
            }
        }

        // Discover the real lcov.info path so SonarQube can find it
        stage('Find Coverage Path') {
            steps {
                script {
                    def lcovPath = sh(
                        script: 'find coverage/ -name "lcov.info" | head -1',
                        returnStdout: true
                    ).trim()

                    if (!lcovPath) {
                        error "lcov.info not found under coverage/. Check karma coverage config."
                    }

                    echo "Found lcov.info at: ${lcovPath}"
                    env.LCOV_PATH = lcovPath
                }
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
                          -Dsonar.projectName=MediFollow-Frontend \
                          -Dsonar.sources=src \
                          -Dsonar.exclusions=**/*.spec.ts,**/node_modules/** \
                          -Dsonar.tests=src \
                          -Dsonar.test.inclusions=**/*.spec.ts \
                          -Dsonar.host.url=http://localhost:9000 \
                          -Dsonar.login=${SONAR_TOKEN} \
                          -Dsonar.javascript.lcov.reportPaths=${LCOV_PATH} \
                          -Dsonar.typescript.lcov.reportPaths=${LCOV_PATH}
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

    post {
        always {
            echo "Pipeline finished with status: ${currentBuild.result ?: 'SUCCESS'}"
        }
        success {
            echo "✅ All stages passed. SonarQube analysis complete."
        }
        failure {
            echo "❌ Pipeline failed. Check logs above."
        }
    }
}