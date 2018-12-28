#!/usr/bin/env python3
# -*- coding:utf-8 -*-

import json
import re
from pymongo import MongoClient
import os

mongo = MongoClient('127.0.0.1', 27017)
mgDB = mongo.v2ex
itemsSet = mgDB.items_n

q = itemsSet.aggregate([
    {'$match': {'$and': [{'y': {"$gt": 2017}}]}},
    {'$group': {'_id': {'section': '$section'}, 'num': {'$sum': '$reply'}, 'count': {'$sum': 1}}},
    {'$sort': {'num': -1}},
    {'$limit': 10},
])
res = []

for item in q:
    res.append([item['_id']['section'], item['num'], item['count']])

print(json.dumps(res))
