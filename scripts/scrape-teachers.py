#!/usr/bin/env python3
"""Scrapes Rajshahi Govt. Polytechnic's faculty-wise teacher list into JSON.

The govt portal paginates 10 per page and exposes ?filters={"faculty":"id"}&page=N.
Run: python3 scripts/scrape-teachers.py > src/data/rpi-teachers.json
"""
import json
import re
import ssl
import sys
import time
import urllib.parse
import urllib.request
from html import unescape

BASE = "https://rajshahi.polytech.gov.bd/views/teacher-list-faculty"
CTX = ssl._create_unverified_context()

FACULTIES = [
    ("civil", "691c1dfe81fc96cef9e6532c", "সিভিল"),
    ("computer", "691c1dfc81fc96cef9e6524f", "কম্পিউটার সাইন্স এন্ড টেকনোলজি"),
    ("mechanical", "691c1dfe81fc96cef9e6531f", "মেকানিক্যাল"),
    ("electrical", "691c1dff81fc96cef9e65368", "ইলেকট্রিক্যাল"),
    ("power", "691c1dfd81fc96cef9e652c7", "পাওয়ার"),
    ("electronics", "691c1dfc81fc96cef9e6521f", "ইলেকট্রোনিক্স"),
    ("electro-medical", "691c1dfe81fc96cef9e65339", "ইলেকট্রোমেডিকেল"),
    ("mechatronics", "691c1dfe81fc96cef9e65312", "মেকাট্রনিক্স"),
    ("non-tech", "691c1dfd81fc96cef9e65282", "নন-টেক"),
]


def fetch(fid, page):
    params = urllib.parse.urlencode({"filters": json.dumps({"faculty": fid}), "page": page})
    req = urllib.request.Request(BASE + "?" + params, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, context=CTX, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def text(html):
    return unescape(re.sub(r"<[^>]+>", " ", html)).strip()


def clean(value):
    return re.sub(r"\s+", " ", text(value)).strip()


def strip_rt(html_value):
    # Designation is inside <rt-renderer encoded-content="...">Bengali text</rt-renderer>.
    m = re.search(r"<rt-renderer[^>]*>(.*?)</rt-renderer>", html_value, re.S)
    return clean(m.group(1)) if m else clean(html_value)


def parse_card(card):
    rows = {}
    for td_label, td_value in re.findall(r"<tr>\s*<td>(.*?)</td>\s*<td>(.*?)</td>\s*</tr>", card, re.S):
        key = clean(td_label)
        if key in ("পদবি",):
            rows[key] = strip_rt(td_value)
        elif key == "ইমেইল":
            rows[key] = clean(td_value).replace(" ", "")
        else:
            rows[key] = clean(td_value)
    img = re.search(r'<img[^>]*src="([^"]+)"', card)
    sl = re.search(r'list-card-body-sl">\s*([^<]+)', card)
    return {
        "serial": clean(sl.group(1)) if sl else "",
        "name": rows.get("নাম", ""),
        "designation": rows.get("পদবি", ""),
        "faculty": rows.get("অনুষদ", ""),
        "department": rows.get("বিভাগ", ""),
        "office": rows.get("অফিস", ""),
        "email": rows.get("ইমেইল", ""),
        "batch": rows.get("ব্যাচ (বিসিএস)", ""),
        "phoneOffice": rows.get("ফোন (অফিস)", ""),
        "phoneHome": rows.get("ফোন (বাসা)", ""),
        "room": rows.get("কক্ষ নম্বর", ""),
        "mobile": rows.get("মোবাইল", ""),
        "photo": img.group(1) if img else "",
    }


def total_entries(html):
    m = re.search(r"মোট\s*([\d,]+)\s*এন্ট্রি", html)
    if not m:
        return 0
    return int(m.group(1).replace(",", ""))


def main():
    teachers = []
    for key, fid, bn in FACULTIES:
        count, page = 0, 1
        while True:
            html = fetch(fid, page)
            if not count:
                count = total_entries(html)
            cards = re.findall(
                r'<div class="widget employee-content-widget">\s*<div class="list-card-body">(.*?)</div>\s*</div>\s*</div>',
                html,
                re.S,
            )
            if not cards:
                cards = re.findall(r'<div class="list-card-body">(.*?)<div class="see-all-btn-block">', html, re.S)
            for card in cards:
                t = parse_card(card)
                if t["name"]:
                    t["facultyKey"] = key
                    teachers.append(t)
            print(f"{key}: page {page}, cards {len(cards)}, total {count}", file=sys.stderr)
            if len(teachers) and sum(1 for x in teachers if x["facultyKey"] == key) >= count:
                break
            page += 1
            if page > 20:
                break
            time.sleep(0.3)
    print(json.dumps(teachers, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
