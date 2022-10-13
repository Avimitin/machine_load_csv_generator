require "time"
require "dotenv/load"
require "sqlite3"

#
# Configuration
#

DB_FILENAME = "test.db"
REMOTE_USER = "avimitin"
MACHINE_ADDR = %w[]



#
# Types and Functions
#

LoadAvg = Struct.new(:one, :five, :fifteen)

def init(db, machines)
  db.execute <<-SQL
CREATE TABLE IF NOT EXISTS machine (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  UNIQUE(name)
);
  SQL

  db.execute <<-SQL
CREATE TABLE IF NOT EXISTS record (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ttime     INTEGER,
  machine   INT,
  one_load  REAL,
  five_load REAL,
  fift_load REAL,
  FOREIGN   KEY(machine) REFERENCES machine(id)
);
  SQL

  machines.each do |m|
    db.execute("INSERT OR IGNORE INTO machine (name) VALUES (?)", m)
  end
end

def insert_new_record(db, machine_id, record, test_time)
  db.execute(
    "INSERT INTO record (ttime, machine, one_load, five_load, fift_load) VALUES (?, ?, ?, ?, ?)",
    [test_time, machine_id, record.one, record.five, record.fifteen]
  )
end

def get_load_avg(machine, user)
  respond = `ssh #{user}@#{machine} uptime`.strip
  result =
    /load average: (?<one>[\d\.]+), (?<five>[\d\.]+), (?<fifteen>[\d\.]+)/.match(
      respond
    )
  loadavg = LoadAvg.new(result["one"], result["five"], result["fifteen"])
  return loadavg
end



#
# Main logic
#

db = SQLite3::Database.open DB_FILENAME
init(db, MACHINE_ADDR)

idx = 1
MACHINE_ADDR.each do |addr|
  current_timestamp = Time.now.to_i
  record = get_load_avg(addr, REMOTE_USER)
  insert_new_record(db, idx, record, current_timestamp)
  idx += 1
end

puts "#{idx - 1} machines tested"
