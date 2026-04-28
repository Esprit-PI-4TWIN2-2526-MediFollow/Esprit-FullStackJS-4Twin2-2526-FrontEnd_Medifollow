pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
    }

    tools {
        nodejs 'nodejs'
    }

    environment {
        SONAR_TOKEN = credentials('sonar-token')
        PUPPETEER_CACHE_DIR = "${WORKSPACE}/.cache/puppeteer"
        NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"
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
                sh '''
                npm ci --prefer-offline --legacy-peer-deps
                '''
            }
        }

        stage('Test & Coverage') {
            agent {
                docker {
                    image 'cypress/browsers:node18.12.0-chrome107'
                    args '--user root'
                    reuseNode true
                }
            }
            steps {
                sh '''
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