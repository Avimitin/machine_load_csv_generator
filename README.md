# Uptime Collector

A lightweight full-stack CPU usage collector, powered by Ruby and React JS.

## Design

Backend is powered by Ruby script `prepare`, `fetch` and `tojson`.
Script `prepare` setup database and data directory.
Script `fetch` iterate all the ssh-able machine and get `uptime(1)` data.
Script `tojson` filter data from database and serialize them to JSON file.
Those data file will be uploaded to GitHub for later use by frontend.

Frontend is powered by vite and React. It is a client side routing static page.
Each request will try to download file from GitHub.

Here is the demo data repo: <https://github.com/Avimitin/unmatched-load-data>,
And here is the demo frontend: <https://unmatched-status.sh1mar.in>.

## Usage

- Backend

```bash
# .env file is also supported

# == Prepare Stage ==
# Where to store sqlite database and machine information
export DATA_PATH=/var/lib/analyze-data
# Database name
export DB_FILENAME=test.db

# Copy and edit the machine details
cp asserts/machMap.example.json machMap.json

# Init database
./prepare


# == Fetch Stage ==
# SSH Config Path
export SSH_CONFIG_PATH=/home/example/.ssh/config
# Fetch data
./fetch


# == Export Stage ==
export OUTPUT_DIR=/path/to/data
# Filter Data
./tojson
```

- Frontend

```bash
cd loadviewer
npm install
npm run build
```
