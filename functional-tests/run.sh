# Runs functional tests via Docker

docker-compose down --remove-orphans && docker-compose rm -vf
docker-compose build && docker-compose up -d
docker-compose run tests npm run test:teamcity -- --host hub || exit $?
docker cp functionaltests_tests_run_1:/tests/errorShots ./errorShots_docker
docker-compose down