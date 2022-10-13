require "csv"
require "sqlite3"
require "time"


#
# Configuration
#

DB_FILENAME = "test.db"
DATETIME = Time.new().strftime("%Y-%m-%d-%H_%M_%S")
HEADERS = %w[TestTime OneMinLoad FiveMinLoad FifteenMinLoad]


#
# Utils function
#

def get_all_machine(db)
  machines = db.execute("SELECT * FROM machine").collect { |row| row }
  return machines
end

def get_data(db, machine_id)
  return(
    db
      .query(
        "SELECT ttime, one_load, five_load, fift_load FROM record WHERE machine=?",
        machine_id
      )
      .collect { |row| row }
  )
end


#
# Main logic
#

db = SQLite3::Database.open(DB_FILENAME)
machines = get_all_machine(db)

machines.each do |m|
  # m[0] is primary id in database, m[1] is the name alias of the machine
  record = get_data(db, m[0])

  CSV.open("#{m[1]}-#{DATETIME}.csv", "w") do |csv|
    csv << HEADERS
    record.each { |rec| csv << rec }
  end
end

puts "Process done"
