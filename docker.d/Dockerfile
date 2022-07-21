FROM public.ecr.aws/lambda/python:3.8

RUN yum install -y curl unzip

# install aws-cli v2
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
  unzip awscliv2.zip && \
  ./aws/install

# install kubectl
RUN curl -o kubectl curl -o kubectl https://s3.us-west-2.amazonaws.com/amazon-eks/1.21.2/2021-07-05/bin/linux/amd64/kubectl && \
  chmod +x kubectl && \
  mv kubectl /usr/local/bin/kubectl


# Copy function code
COPY app.py ${LAMBDA_TASK_ROOT}

# Install the function's dependencies using file requirements.txt
# from your project folder.

COPY requirements.txt  .
RUN  pip3 install -r requirements.txt --target "${LAMBDA_TASK_ROOT}"

# WORKDIR /var/task

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "app.apply_handler" ]