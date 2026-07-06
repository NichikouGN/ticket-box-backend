build:
	docker-compose build 

create-cluster:
	kind create cluster --name ticket-box --config kind-config.yml

delete-cluster:
	kind delete cluster --name ticket-box

load-images:
	./load-images.sh

load-env:
	./load-env.sh

apply-k8s:
	kubectl apply -f k8s/ --recursive

delete-k8s:
	kubectl delete -f k8s/ --recursive

refresh-k8s:
	kubectl rollout restart deployment --all

get-pods:
	kubectl get pods

start-all:
	make build
	make create-cluster
	make load-images
	make load-env
	make apply-k8s
	sleep 4
	make get-pods

refresh-all:
	make build
	make load-images
	make load-env
	make refresh-k8s
	sleep 4
	make get-pods


SERVICE ?=

refresh-single:
ifndef SERVICE
	$(error SERVICE is not set. Usage: make refresh-single SERVICE=<service-name>)
endif
	docker compose build $(SERVICE)
	make load-images
	make load-env
	kubectl rollout restart deployment $(SERVICE)
	sleep 4
	make get-pods

restart-all:
	make delete-k8s
	make delete-cluster
	make create-cluster
	make load-images
	make load-env
	make apply-k8s
	sleep 4
	make get-pods



