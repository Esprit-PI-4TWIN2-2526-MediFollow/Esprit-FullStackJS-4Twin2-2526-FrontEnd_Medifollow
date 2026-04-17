pipeline {
    agent any

    tools {
        nodejs 'nodejs'
    }

    environment {
        SONAR_TOKEN = credentials('sonar-token')
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/Esprit-PI-4TWIN2-2526-MediFollow/Esprit-FullStackJS-4Twin2-2526-FrontEnd_Medifollow.git'
            }
        }

        stage('Install Chrome Dependencies') {
            steps {
                sh '''
                set -eu

                if command -v apt-get >/dev/null 2>&1; then
                    if [ "$(id -u)" = "0" ]; then
                        APT="apt-get"
                    elif command -v sudo >/dev/null 2>&1; then
                        APT="sudo apt-get"
                    else
                        echo "Chrome system dependencies are missing and this Jenkins agent is not root."
                        echo "Fix the Jenkins Docker image or run: docker exec -u root -it jenkins bash"
                        echo "Then install the packages listed in the Jenkinsfile stage 'Install Chrome Dependencies'."
                        exit 1
                    fi

                    $APT update
                    ASOUND_PACKAGE="libasound2"
                    if ! apt-cache show "$ASOUND_PACKAGE" >/dev/null 2>&1; then
                        ASOUND_PACKAGE="libasound2t64"
                    fi

                    $APT install -y \
                        libglib2.0-0 \
                        libnss3 \
                        libnspr4 \
                        libatk1.0-0 \
                        libatk-bridge2.0-0 \
                        libcups2 \
                        libdrm2 \
                        libdbus-1-3 \
                        libxkbcommon0 \
                        libxcomposite1 \
                        libxdamage1 \
                        libxfixes3 \
                        libxrandr2 \
                        libgbm1 \
                        "$ASOUND_PACKAGE" \
                        libpango-1.0-0 \
                        libcairo2 \
                        fonts-liberation
                else
                    echo "apt-get was not found on this Jenkins agent."
                    echo "Install Chrome runtime dependencies in the Jenkins image/agent before running tests."
                    exit 1
                fi
                '''
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
                export CHROME_BIN=$(node -e "console.log(require('puppeteer').executablePath())")
                echo "Using Chrome: $CHROME_BIN"
                npm run test:cov
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
                        -Dsonar.host.url=http://localhost:9000 \
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
