%:
	PYTHONUNBUFFERED=1 ansible-playbook -e'@default.yml' \
    playbooks/app.yml -e "stack_name=$@"                          \
    -e "quay_io_deploy_key=${QUAY_IO_DEPLOY_KEY}"
