import * as path from 'path';
import {
  App, Stack, StackProps, CfnOutput,
  aws_lambda as lambda,
  aws_eks as eks,
  aws_ec2 as ec2,
  aws_iam as iam,
  Duration,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', { isDefault: true });
    // or create a new vpc as below:
    // const vpc = new ec2.Vpc(this, 'Vpc', { natGateways: 1 });

    const cluster = new eks.Cluster(this, 'Cluster', {
      version: eks.KubernetesVersion.V1_21,
      defaultCapacity: 1,
      vpc,
    });

    const fn = new lambda.DockerImageFunction(this, 'Func', {
      code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../docker.d')),
      environment: {
        // lambda function role will assume this role to run `aws eks update-kubeconfig`
        ADMIN_ROLE_ARN: cluster.adminRole.roleArn,
        CLUSTER_NAME: cluster.clusterName,
      },
      memorySize: 256,
      // increase the timeout
      timeout: Duration.seconds(30),
    });

    // allow lambda role to eks:DescribeCluster only aginst this cluster
    fn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['eks:DescribeCluster'],
      // use ['*'] for all clusters if you prefer
      resources: [cluster.clusterArn],
    }));

    // allow the lambda function role to assume the EKS cluster master role so we can run
    // aws eks update-kubeconfig with this master role in lambda
    cluster.adminRole.grantAssumeRole(fn.role!);

    new CfnOutput(this, 'LambdaRole', { value: fn.role!.roleArn });
    new CfnOutput(this, 'ClusterAdminRole', { value: cluster.adminRole.roleArn });
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'kubectl-in-lambda-dev2', { env: devEnv });
// new MyStack(app, 'kubectl-in-lambda-prod', { env: prodEnv });

app.synth();