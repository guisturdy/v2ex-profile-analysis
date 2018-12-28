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
    {'$match': {'$and': [{'y': {'$gt': 2017}}]}},
    {'$group': {'_id': {'w': '$w', 'h': '$h'}, 'num': {'$sum': 1}}},
    {'$sort': {'_id.m': 1, '_id.w': 1, '_id.h': 1}}
])

res = []

for item in q:
    res.append([item['_id']['w'], item['_id']['h'], item['num']])

print(json.dumps(res))