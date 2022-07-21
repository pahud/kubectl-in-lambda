#
# this lambda function generates the `kubeconfig` by running `aws eks update-kubeconfig`
# and runs `kubectl` command with the cluster master role
#

import json
import logging
import os
import subprocess

logger = logging.getLogger()
logger.setLevel(logging.INFO)

os.environ['PATH'] = '/usr/local/bin:' + os.environ['PATH']

outdir = os.environ.get('TEST_OUTDIR', '/tmp')
kubeconfig = os.path.join(outdir, 'kubeconfig')

def apply_handler(event, context):
    logger.info(json.dumps(dict(event, ResponseURL='...')))

    # lambda role will assume this role to run aws eks update-kubeconfig
    role_arn = region = os.environ.get('ADMIN_ROLE_ARN')
    cluster_name = region = os.environ.get('CLUSTER_NAME')

    # "log in" to the cluster
    cmd = [ 'aws', 'eks', 'update-kubeconfig',
        '--role-arn', role_arn,
        '--name', cluster_name,
        '--kubeconfig', kubeconfig
    ]
    logger.info(f'Running command: {cmd}')
    subprocess.check_call(cmd)

    if os.path.isfile(kubeconfig):
        os.chmod(kubeconfig, 0o600)

    # let's just list all nodes
    list_nodes()

def list_nodes():
    kubectl('get', 'no')

def kubectl(verb, *opts):
    maxAttempts = 3
    retry = maxAttempts
    while retry > 0:
        try:
            cmd = ['kubectl','--kubeconfig', kubeconfig, verb] + list(opts)
            logger.info(f'Running command: {cmd}')
            output = subprocess.check_output(cmd, stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError as exc:
            output = exc.output
            if b'i/o timeout' in output and retry > 0:
                retry = retry - 1
                logger.info("kubectl timed out, retries left: %s" % retry)
            else:
                raise Exception(output)
        else:
            logger.info(output)
            return
    raise Exception(f'Operation failed after {maxAttempts} attempts: {output}')