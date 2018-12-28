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

import thulac
import threading
import multiprocessing
import math

mongo = MongoClient('127.0.0.1', 27017)

mgDB = mongo.v2ex

itemsSet = mgDB.items_n
repliesSet = mgDB.replies_n
keywordsSet = mgDB.keywords
keywordsReplySet = mgDB.keywordsReply

"""
n/名词 np/人名 ns/地名 ni/机构名 nz/其它专名
m/数词 q/量词 mq/数量词 t/时间词 f/方位词 s/处所词
v/动词 a/形容词 d/副词 h/前接成分 k/后接成分
i/习语 j/简称 r/代词 c/连词 p/介词 u/助词 y/语气助词
e/叹词 o/拟声词 g/语素 w/标点 x/其它
"""
thu = thulac.thulac(user_dict=None, model_path=None,
                    T2S=True, seg_only=False, filt=True, deli='_')
needWordType = set(['n', 'np', 'ns', 'ni', 'nz'])
re_empty = re.compile(r'^\s+$')

keywords = []


def getKeywords(str):
    kwArr = list(map(lambda x: x[0], filter(
        lambda _item: _item[1] in needWordType and not re_empty.match(_item[0]), thu.cut(str))))
    dic = {}
    for kw in kwArr:
        dic[kw] = dic.get(kw, 0)+1
    return dic


def pushKeywords(item, textKey, id, type):
    dic = getKeywords(item[textKey])
    for kw in dic:
        keywords.append({
            'kw': kw,
            'count': dic[kw],
            'rid': item[id],
            'w': item['w'],
            'm': item['m'],
            'd': item['d'],
            'type': type
        })


cupCount = multiprocessing.cpu_count()


def runAnalysisKeywords(pross):
    for i in range(math.ceil(len(pross) / cupCount)):
        workArr = []
        for p in pross[i*cupCount:(i+1)*cupCount]:
            workArr.append(threading.Thread(target=pushKeywords, args=p))
            workArr[-1].start()
            workArr[-1].join()


skip = 0
limit = 100

q = itemsSet.find({'y': {'$gt': 2017}}).limit(limit).skip(skip)

while q.count():
    keywords = []

    pross = []
    hasRow = False
    for item in q:
        hasRow = True
        if 'title' in item:
            pross.append((item, 'title', 'id', 'title'))
        if 'content' in item:
            pross.append((item, 'content', 'id', 'content'))
    if hasRow:
        runAnalysisKeywords(pross)
    else: 
        break
    if keywords:
        keywordsSet.insert_many(keywords)
    print('[%s][itemsSet] limitOffset: %s' % (datetime.now(), skip))
    skip += limit
    q = itemsSet.find({'y': {'$gt': 2017}}).limit(limit).skip(skip)


skip = 0
q = repliesSet.find({'y': {'$gt': 2017}}).limit(limit).skip(skip)

while q.count():
    keywords = []
    pross = []
    hasRow = False
    for item in q:
        hasRow = True
        if 'content' in item:
            pross.append((item, 'content', 'mainId', 'reply'))
    if hasRow:
        runAnalysisKeywords(pross)
    else: 
        break
    if keywords:
        keywordsReplySet.insert_many(keywords)
    print('[%s][repliesSet] limitOffset: %s' % (datetime.now(), skip))
    skip += limit
    q = repliesSet.find({'y': {'$gt': 2017}}).limit(limit).skip(skip)
