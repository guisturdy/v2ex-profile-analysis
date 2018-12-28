#!/usr/bin/env python3
# -*- coding:utf-8 -*-

import sqlite3
from bs4 import BeautifulSoup
import json
import re
from dateutil import parser
from datetime import datetime, timedelta
from pymongo import MongoClient

conn = sqlite3.connect('/Users/oyhw/Developer/v2ex-overview/spider/v2ex.db')
mongo = MongoClient('127.0.0.1', 27017)

mgDB = mongo.v2ex

itemsSet = mgDB.items_n
repliesSet = mgDB.replies_n

cursor = conn.cursor()

maxID = 520311
nowID = 0

limitOffset = 0
limitSize = 200


def offsetToTime(offset):
    _t = map(lambda str: re.split(r'\s+', str), offset)
    _offset = 0

    for n, type in _t:
        _n = int(n)
        if type == '天':
            _offset += _n * 24 * 60 * 60 * 1000
        elif type == '小时':
            _offset += _n * 60 * 60 * 1000
        elif type == '分钟':
            _offset += _n * 60 * 1000
        elif type == '秒':
            _offset += _n * 1000
    return _offset


while nowID < maxID:
    items = []
    replies = []

    sql = 'select id, page, info, status from v2ex limit %s,%s' % (
        limitOffset, limitSize)
    print('start fetchall: %s' % sql)
    cursor.execute(sql)
    _rows = cursor.fetchall()
    print('fetchall end %s row' % len(_rows))
    for row in _rows:
        if row[3] == 0 or row[0] > maxID:
            continue
        soup = BeautifulSoup(row[2], features="lxml")
        _rowInfo = {'id': row[0]}
        nowID = max(row[0], nowID)
        if soup.find('meta', property="article:published_time"):
            bodyPublishTime = parser.parse(soup.find(
                'meta', property="article:published_time").attrs['content']) + timedelta(hours=8)

            topicInfo = soup.find('div', class_="topic_author")

            _rowInfo = {
                'id': row[0],
                'section': soup.find('meta', property="article:section").attrs['content'],
                'publichTime': bodyPublishTime,
                'w': bodyPublishTime.weekday(),
                'y': bodyPublishTime.year,
                'm': bodyPublishTime.month,
                'd': bodyPublishTime.day,
                'h': bodyPublishTime.hour,
                'title': soup.find('div', class_="topic_title").text,
                'name': topicInfo.contents[1].attrs['alt'],
                'content': soup.find('div', class_='topic_content').text,
                'hits': int(
                    re.search(r'([0-9]+)', soup.find('div', class_='topic_hits').text).group()),
                'reply': int(re.search(
                    r'([0-9]+)', soup.find('div', class_='topic_stats').text).group())
            }
            createTime = topicInfo.contents[0].text
            createTimeOffset = re.findall(
                r'([0-9]+\s+[天小时分钟秒]{1,2})', createTime)
            bodyCreateTimeOffset = 0
            if createTimeOffset:
                bodyCreateTimeOffset = offsetToTime(createTimeOffset)
            _pageInfo = soup.find('div', class_="pagination")
            if _pageInfo:
                _currentPage = int(re.match(
                    r'第\s+([0-9]+)\s+页', _pageInfo.text).group(1))
                if _currentPage == 1:
                    items.append(_rowInfo)
            _replies = soup.find_all('div', class_="reply_item")
            if _replies:
                for _reply in _replies:
                    _publichTimeText = _reply.find(
                        'div', class_="reply_created").text
                    _publichTime = _reply.find(
                        'div', class_="reply_created").text
                    _p = bodyPublishTime
                    _replyCreateTimeOffset = re.findall(
                        r'([0-9]+\s+[天小时分钟秒]{1,2})', _publichTimeText)
                    if _replyCreateTimeOffset:
                        if not re.findall(r'([小时分钟秒]{1,2})', _publichTimeText):
                            _r['impreciseDate'] = True
                        _p = _p + \
                            timedelta(milliseconds=offsetToTime(
                                _replyCreateTimeOffset) - bodyCreateTimeOffset)
                    else:
                        try:
                            _p = parser.parse(_publichTimeText)
                        finally:
                            pass

                    _r = {
                        'mainId': _rowInfo['id'],
                        'publichTime': _p,
                        'w': _p.weekday(),
                        'y': _p.year,
                        'm': _p.month,
                        'd': _p.day,
                        'h': _p.hour,
                        'name': _reply.find('div', class_="reply_author_name").text,
                        'content': _reply.find(
                            'div', class_="reply_content").text
                    }
                    replies.append(_r)
            pass
        else:
            _rowInfo['body'] = row[2]
            items.append(_rowInfo)

    itemsSet.insert_many(items)
    repliesSet.insert_many(replies)
    print('[%s] limitOffset: %s nowMaxID: %s' %
          (datetime.now(), limitOffset, nowID))
    limitOffset += limitSize
