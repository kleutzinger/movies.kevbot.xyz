#!/usr/bin/env python3
import csv
import gzip
import os
import sqlite3
import time
import urllib.request

NOYEAR = "\\N"
IMDB_YEARS_DB = "imdb_years.db"
DL_LINK = "https://datasets.imdbws.com/name.basics.tsv.gz"
GZ_FILE = "name.basics.tsv.gz"
BATCH_SIZE = 100_000


def init_sqlite_table():
    if os.path.exists(IMDB_YEARS_DB):
        print(f"removing {IMDB_YEARS_DB}")
        os.remove(IMDB_YEARS_DB)
    conn = sqlite3.connect(IMDB_YEARS_DB)
    c = conn.cursor()
    c.execute('''CREATE TABLE years
                 (imdb_id text, birth_year integer, death_year integer)''')
    c.execute('''CREATE INDEX imdb_id_index ON years (imdb_id)''')
    conn.commit()
    conn.close()


print(f"downloading {DL_LINK}")
urllib.request.urlretrieve(DL_LINK, GZ_FILE)

init_sqlite_table()

conn = sqlite3.connect(IMDB_YEARS_DB)
c = conn.cursor()

skipped = 0
count = 0
batch = []
start = time.monotonic()

print(f"reading {GZ_FILE} and inserting into {IMDB_YEARS_DB}")
with gzip.open(GZ_FILE, "rt", encoding="ISO-8859-1") as f:
    reader = csv.reader(f, delimiter="\t")
    next(reader)  # skip header
    c.execute("BEGIN TRANSACTION")
    for idx, row in enumerate(reader):
        imdb_id, birth, death = row[0], row[2], row[3]
        if birth == NOYEAR and death == NOYEAR:
            skipped += 1
            continue
        batch.append((
            imdb_id,
            birth if birth != NOYEAR else None,
            death if death != NOYEAR else None,
        ))
        if len(batch) >= BATCH_SIZE:
            c.executemany("INSERT INTO years VALUES (?, ?, ?)", batch)
            count += len(batch)
            batch = []
            c.execute("COMMIT")
            print(f"  {count:,} rows inserted")
            c.execute("BEGIN TRANSACTION")

    if batch:
        c.executemany("INSERT INTO years VALUES (?, ?, ?)", batch)
        count += len(batch)
    c.execute("COMMIT")

conn.close()
os.remove(GZ_FILE)

end = time.monotonic()
print(f"skipped {skipped:,} actors without data")
print(f"inserted {count:,} rows into {IMDB_YEARS_DB}")
print(f"took {end - start:.1f} seconds")
print("success!")
