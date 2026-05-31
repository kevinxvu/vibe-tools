#!/usr/bin/env bash

# Ensure the database container is online and usable
# echo "Waiting for database..."
until docker exec -i vibetools.db mysql -uvibetools -pvibetools123 -e "SELECT 1" &> /dev/null
do
  # printf "."
  sleep 1
done
