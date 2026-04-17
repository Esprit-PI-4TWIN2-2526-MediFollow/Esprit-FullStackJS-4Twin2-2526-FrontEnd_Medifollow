     pipeline {
         agent any
 
         environment {
             SONAR_TOKEN = credentials('sonar-token')
             CHROME_BIN = '/usr/bin/chromium-browser'
         }
 
         stages {
            stage('Check Node') {
                steps {
                    sh 'node -v'
                    sh 'npm -v'
                }
        }
 
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
                      sh '''
                     export CHROME_BIN=/usr/bin/google-chrome
                      npx ng test --code-coverage --watch=false --browsers=ChromeHeadless
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