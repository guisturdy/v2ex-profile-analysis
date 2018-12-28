#!/usr/bin/env python3
# -*- coding:utf-8 -*-

import json
import re
from pymongo import MongoClient
import os

mongo = MongoClient('127.0.0.1', 27017)
mgDB = mongo.v2ex
itemsSet = mgDB.keywords

q = itemsSet.aggregate([
    {'$match': {'$and': [{'kw': {"$regex": "^[a-zA-Z]*$"}}]}},
    {'$group': {'_id': {'kw': {'$toLower': "$kw"}}, 'num': {'$sum': '$count'}}},
    {'$sort': {'num': -1}},
    {'$limit': 500},
])
res = []

for item in q:
    res.append([item['_id']['kw'], item['num']])

print(json.dumps(res))
