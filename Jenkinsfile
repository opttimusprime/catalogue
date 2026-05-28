pipeline {
    agent any

    environment {
        AWS_REGION   = "us-east-1"
        ECR_REGISTRY = "942548380129.dkr.ecr.us-east-1.amazonaws.com"
        ECR_REPO     = "catalogue"
        IMAGE_TAG    = "${BUILD_NUMBER}"

        K8S_NAMESPACE = "catalogue"
        HELM_RELEASE  = "catalogue"
        HELM_CHART    = "kubernetes/helm"
        VALUES_FILE   = "kubernetes/helm/values-dev.yaml"
    }

    tools {
        nodejs "nodejs"
    }

    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Checkout Code') {
            steps {
                git branch: 'develop',
                    url: 'git@github.com:optimusprrime/catalogue.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('SonarQube Scan') {
            steps {
                withSonarQubeEnv('sonarqube') {
                    sh """
                        sonar-scanner \
                        -Dsonar.projectKey=catalogue \
                        -Dsonar.projectName=catalogue \
                        -Dsonar.sources=.
                    """
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh """
                    docker build \
                    -t ${ECR_REPO}:${IMAGE_TAG} .
                """
            }
        }

        stage('Login to ECR') {
            steps {
                sh """
                    aws ecr get-login-password --region ${AWS_REGION} | \
                    docker login --username AWS --password-stdin ${ECR_REGISTRY}
                """
            }
        }

        stage('Tag Docker Image') {
            steps {
                sh """
                    docker tag ${ECR_REPO}:${IMAGE_TAG} \
                    ${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG}
                """
            }
        }

        stage('Push Docker Image') {
            steps {
                sh """
                    docker push ${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG}
                """
            }
        }

        stage('Update Kubeconfig') {
            steps {
                sh """
                    aws eks update-kubeconfig \
                    --region ${AWS_REGION} \
                    --name roboshop-dev-eks
                """
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh """
                    helm upgrade --install ${HELM_RELEASE} ${HELM_CHART} \
                    --namespace ${K8S_NAMESPACE} \
                    --create-namespace \
                    -f ${VALUES_FILE} \
                    --set image.repository=${ECR_REGISTRY}/${ECR_REPO} \
                    --set image.tag=${IMAGE_TAG}
                """
            }
        }

        stage('Verify Deployment') {
            steps {
                sh """
                    kubectl rollout status deployment/${HELM_RELEASE} -n ${K8S_NAMESPACE}
                    kubectl get pods -n ${K8S_NAMESPACE}
                    kubectl get svc -n ${K8S_NAMESPACE}
                """
            }
        }
    }

    post {
        success {
            echo "Catalogue build and deployment completed successfully"
        }

        failure {
            echo "Catalogue build or deployment failed"
        }
    }
}