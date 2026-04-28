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
        PUPPETEER_CACHE_DIR = "${WORKSPACE}/.cache/puppeteer"
        NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/Esprit-PI-4TWIN2-2526-MediFollow/Esprit-FullStackJS-4Twin2-2526-FrontEnd_Medifollow.git'
            }
        }

        stage('Install') {
            steps {
                sh '''
                set -eux

                npm ci --prefer-offline --legacy-peer-deps
                npx puppeteer browsers install chrome
                '''
            }
        }

        stage('Test & Coverage') {
            steps {
                script {
                    env.CHROME_BIN = sh(
                        script: 'node -e "const puppeteer = require(\'puppeteer\'); console.log(puppeteer.executablePath());"',
                        returnStdout: true
                    ).trim()
                }
                sh '''
                set -eux

                echo "Using Chrome: $CHROME_BIN"
                test -x "$CHROME_BIN"
                "$CHROME_BIN" --version

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
    }
}
