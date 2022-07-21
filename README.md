# kubectl-in-lambda

This is CDK sample to deploy Amazon EKS cluster and a separate lambda function to execute `kubectl` command in Lambda against the cluster.

## HOWTO

This stack creates an Amazon ESK cluster 1.21 and a Lambda function with container runtime. After the deployment, go to the lambda console and manually execute the function. It will simply run `kubectl get no` and list the nodes in the lambda log streams.

## deploy

```sh
$ npx cdk diff
$ cdk deploy
```

## destroy 

```sh
$ npx cdk destroy
```
