## Usage

```bash
# .env file is also supported
# Database name
export MACHINE_LOAD_DB=test.db
# Comma separated ssh alias. Please setup your ssh config before using this script
export MACHINE_ADDR=machine1,machine2
# Where to store csv and sqlite database
export DATA_PATH=/var/lib/analyze-data

# Fetch data
./fetch

# Generate CSV
./tocsv

# Filter Data
./analyze $machine-$date.csv

# View data (Require csvkit)
csvlook p95-$machine-$date.csv
```
