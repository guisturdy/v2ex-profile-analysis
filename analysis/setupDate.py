#!/usr/bin/env python3
# -*- coding:utf-8 -*-

import sqlite3
from bs4 import BeautifulSoup
import json
import re
from dateutil import parser
from datetime import datetime, timedelta
from pymongo import MongoClient
from pytz import timezone

mongo = MongoClient('127.0.0.1', 27017)

mgDB = mongo.v2ex

itemsSet = mgDB.items
repliesSet = mgDB.replies

timeOffset = datetime(2017, 10, 23, 0, 0, 0, 0)

while timeOffset < datetime(2018, 12, 26, 0, 0, 0, 0):
    print()
    realTime = timeOffset + timedelta(hours=8)
    q = repliesSet.update_many({u'publichTime': {'$gte': timeOffset, '$lt': timeOffset+timedelta(hours=1)}}, {
                             '$set': {'y': realTime.year, 'm': realTime.month, 'd': realTime.day, 'h': realTime.hour}})
    print('[%s] %s : %s' % (datetime.now(), realTime, q.matched_count))
    timeOffset += timedelta(hours=1)
