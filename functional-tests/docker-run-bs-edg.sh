
# Runs functional tests via Docker

# Avoid "Mount denied" errors for Chrome/Firefox containers on Windows
# See https://github.com/docker/for-win/issues/1829#issuecomment-376328022
export COMPOSE_CONVERT_WINDOWS_PATHS=1

# Clean up before starting containers
docker exec functional-tests_database_1 kill 1 || :
docker-compose down --remove-orphans && docker-compose rm -vf
docker-compose build && docker-compose up -d

# Wait for comments webapp before running the tests
docker-compose run tests waitforit -t 120 --strict comments:8080 -- npm run test:browserstack:edge

# Copy error shots and logs to use as a TeamCity artifact for debugging purposes
mkdir -p docker-output
docker cp functional-tests_tests_1:/tests/errorShots ./docker-output/errorShots
docker cp functional-tests_comments_1:/app/logs ./docker-output
docker-compose logs --no-color > ./docker-output/logs.txt

# Clean up
docker volume ls
docker-compose down -v
docker volume ls
#docker volume prune -f
