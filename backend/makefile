DOCKER := docker-compose
ENV := --env-file .env.example # это нужно менять если требуется
FILES := --file docker-compose.yml

FLAGS := ${ENV} ${FILES}
IMAGES := $(shell ${DOCKER} ${FLAGS} images -q)

VOLUME_DIR := ./docker/volumes
INIT_DIR_CMD := $(shell [ -d ${VOLUME_DIR} ] || mkdir -p ./docker/volumes)

init-dir: 
	${INIT_DIR_CMD}
	
docker-up:
	${INIT_DIR_CMD}
	${DOCKER} ${FLAGS} up -d
docker-up-build:
	${INIT_DIR_CMD}
	${DOCKER} ${FLAGS} up -d --build

docker-down:
	${DOCKER} ${FLAGS} down -v
docker-rmi:
	-${DOCKER} ${FLAGS} down -v
	-docker rmi -f ${IMAGES}

docker-rm-pgdata:
	sudo rm -rf ${VOLUME_DIR}

docker-stop:
	-docker stop $(shell docker ps -a -q)
	-docker rm $(shell docker ps -a -q)
docker-clear:
	make docker-stop
	-docker rmi -f $(shell docker images -aq)
	-docker volume rm $(shell docker volume ls -q)