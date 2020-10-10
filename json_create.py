import csv
import collections
import os
import json

NOYEAR = "\\N"

DL_LINK = "https://datasets.imdbws.com/name.basics.tsv.gz"

print("wget name.basics.tsv.gz csv")
os.system("wget " + DL_LINK)

print("extract gz")
os.system("gzip -d -v name.basics.tsv.gz")


def normalize_year(yr):
    if yr == "\\N":
        return "0000"
    else:
        return yr.zfill(4)


new_columns = ["imdb_id", "birth_year", "death_year"]
tsv_file = "name.basics.tsv"
output_file = "imdb_years.json"
year_table = dict()
with open(tsv_file, "r") as csvfile:
    datareader = csv.reader(csvfile, delimiter="\t")
    lengths = collections.Counter()
    for (idx, row) in enumerate(datareader):
        # print(idx, row)
        imdb_id, birth, death = [row[0], row[2], row[3]]
        lengths[len(imdb_id)] += 1
        # birth, death = normalize_year(birth), normalize_year(death)
        if idx % 10 ** 8 == 0:
            print(idx, "so far")
        if birth == NOYEAR and death == NOYEAR:
            continue
        year_table[imdb_id] = dict()
        if birth != NOYEAR:
            year_table[imdb_id]["b"] = birth
        if death != NOYEAR:
            year_table[imdb_id]["d"] = death
    print(lengths)

with open(output_file, "w") as outfile:
    json.dump(year_table, outfile)

print("wrote " + output_file)

os.remove(tsv_file)
print("success!")
