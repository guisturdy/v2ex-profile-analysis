#!/usr/bin/env python3
# -*- coding:utf-8 -*-

import json
import re
from pymongo import MongoClient
import os

mongo = MongoClient('127.0.0.1', 27017)
mgDB = mongo.v2ex
itemsSet = mgDB.items_n

q = itemsSet.find(
    {'$and': [
        {'y': {"$gt": 2017}},
        {'section':  {'$not': {"$eq": '推广'}}},
        {'title': {"$regex": "^[^送(抽奖)(利是)]*$"}},
    ]}).sort([('reply',-1),('hits',-1)]).limit(10)
""" 

//10大热帖
db.getCollection('items_n').find({  $and:[{y:{$gt:2017}},{section:{$not:{$eq:'推广'}}}, {title:{$regex:/^[^送(抽奖)(利是)]*$/}}] }).sort({reply: -1,hits:-1, }).limit(10)

 """
res = []

for item in q:
    res.append([item['id'], item['title'], item['reply'], item['hits']])

print(json.dumps(res))
