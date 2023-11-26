import csv
import collections
import os
import json
import sqlite3

NOYEAR = "\\N"
IMDB_YEARS_DB = "imdb_years.db"

DL_LINK = "https://datasets.imdbws.com/name.basics.tsv.gz"

os.system("wget " + DL_LINK)

print("extract gz")
os.system("gzip -d name.basics.tsv.gz")

def init_sqlite_table():
    if os.path.exists(IMDB_YEARS_DB):
        print(f"removing {IMDB_YEARS_DB}")
        os.remove(IMDB_YEARS_DB,)
    conn = sqlite3.connect(IMDB_YEARS_DB)
    c = conn.cursor()
    c.execute('''CREATE TABLE years
                 (imdb_id text, birth_year integer, death_year integer)''')
    # create index on imdb_id
    c.execute('''CREATE INDEX imdb_id_index
                 ON years (imdb_id)''')
    conn.commit()
    conn.close()


def normalize_year(yr):
    if yr == "\\N":
        return "0000"
    else:
        return yr.zfill(4)


new_columns = ["imdb_id", "birth_year", "death_year"]
tsv_file = "name.basics.tsv"
year_table = dict()
skipped = 0
with open(tsv_file, "r", encoding="ISO-8859-1") as csvfile:
    print(f"reading {tsv_file}")
    datareader = csv.reader(csvfile, delimiter="\t")
    lengths = collections.Counter()
    for (idx, row) in enumerate(datareader):
        # print(idx, row)
        imdb_id, birth, death = [row[0], row[2], row[3]]
        lengths[len(imdb_id)] += 1
        # birth, death = normalize_year(birth), normalize_year(death)
        if idx % 10 ** 6 == 0 and idx != 0:
            print(f"{idx:,} rows processed")
        if birth == NOYEAR and death == NOYEAR:
            skipped += 1
            continue
        year_table[imdb_id] = dict()
        if birth != NOYEAR:
            year_table[imdb_id]["b"] = birth
        if death != NOYEAR:
            year_table[imdb_id]["d"] = death
    print(lengths)
print("skipped ", skipped, "actors without data")

import time
init_sqlite_table()
start = time.monotonic()

# efficiently insert 10 million rows into sqlite

print(f"inserting into {IMDB_YEARS_DB}")
conn = sqlite3.connect(IMDB_YEARS_DB)
c = conn.cursor()
c.execute("BEGIN TRANSACTION")
count = 0
for imdb_id, years in year_table.items():
    c.execute("INSERT INTO years VALUES (?, ?, ?)", (imdb_id, years.get("b", None), years.get("d", None)))
    count += 1
c.execute("COMMIT")
conn.close()
end = time.monotonic()
print("inserted " + str(count) + " rows" + " into " + IMDB_YEARS_DB)
print("took " + str(end - start) + " seconds")

os.remove(tsv_file)
print("success!")
