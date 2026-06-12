# Wyszukuje na YouTube krótkie filmy techniczne dla ćwiczeń z planu.
# Wynik: tools/videos.json (do ręcznego przejrzenia przed wstawieniem do plan.js).
import json, re, time, urllib.request, urllib.parse, sys

QUERIES = {
    # główne
    "FLAT DB PRESS": "how to dumbbell bench press technique",
    "INCLINE CHEST-SUPPORTED DB ROW": "how to chest supported dumbbell row technique",
    "LEG PRESS": "how to leg press technique",
    "LEG PRESS TOE PRESS": "leg press calf raise technique",
    "DB ROMANIAN DEADLIFT": "how to dumbbell romanian deadlift technique",
    "SEATED DB SHOULDER PRESS": "how to seated dumbbell shoulder press technique",
    "LAT PULLDOWN": "how to lat pulldown technique",
    "ROPE FACEPULL": "how to cable face pull technique",
    "LEG EXTENSION": "how to leg extension technique",
    "SEATED LEG CURL": "how to seated leg curl technique",
    "EZ BAR CURL": "how to ez bar curl technique",
    "EZ BAR SKULL CRUSHER": "how to ez bar skull crusher technique",
    # zamienniki
    "MACHINE CHEST PRESS": "how to machine chest press technique",
    "WEIGHTED DIP": "how to weighted dip technique",
    "1-ARM DB ROW": "how to one arm dumbbell row technique",
    "SEATED CABLE ROW": "how to seated cable row technique",
    "HACK SQUAT": "how to hack squat technique",
    "GOBLET SQUAT": "how to goblet squat technique",
    "SEATED CALF RAISE": "how to seated calf raise technique",
    "STANDING CALF RAISE": "how to standing calf raise technique",
    "ROMANIAN DEADLIFT": "how to barbell romanian deadlift technique",
    "45' HYPEREXTENSION": "how to 45 degree back extension technique",
    "MACHINE SHOULDER PRESS": "how to machine shoulder press technique",
    "STANDING DB ARNOLD PRESS": "how to arnold press technique",
    "NEUTRAL-GRIP PULLDOWN": "how to neutral grip lat pulldown technique",
    "2-GRIP PULL-UP": "how to pull up technique",
    "CABLE LATERAL RAISE": "how to cable lateral raise technique",
    "REVERSE PEC DECK": "how to reverse pec deck technique",
    "DB STEP UP": "how to dumbbell step up technique",
    "LYING LEG CURL": "how to lying leg curl technique",
    "NORDIC HAM CURL": "how to nordic ham curl technique",
    "DB CURL": "how to dumbbell curl technique",
    "CABLE EZ CURL": "how to cable ez bar curl technique",
    "OVERHEAD CABLE TRICEPS EXTENSION": "how to overhead cable triceps extension technique",
    "DB FRENCH PRESS": "how to dumbbell french press triceps technique",
}

PREFERRED = ["renaissance periodization", "jeff nippard", "scotthermanfitness",
             "scott herman", "my training app", "puregym", "mind pump tv"]

def fetch(query):
    url = "https://www.youtube.com/results?search_query=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept-Language": "en",
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")

def find_renderers(node, out):
    if isinstance(node, dict):
        if "videoRenderer" in node:
            out.append(node["videoRenderer"])
        for v in node.values():
            find_renderers(v, out)
    elif isinstance(node, list):
        for v in node:
            find_renderers(v, out)

def parse_results(html):
    m = re.search(r"var ytInitialData = ({.*?});</script>", html, re.S)
    if not m:
        return []
    data = json.loads(m.group(1))
    vids, out = [], []
    find_renderers(data, vids)
    for v in vids:
        try:
            vid = v["videoId"]
            title = "".join(r.get("text", "") for r in v["title"]["runs"])
            length = v.get("lengthText", {}).get("simpleText", "")
            channel = v.get("ownerText", {}).get("runs", [{}])[0].get("text", "")
            out.append({"id": vid, "title": title, "len": length, "channel": channel})
        except (KeyError, IndexError):
            continue
    return out

def secs(length):
    parts = length.split(":")
    if len(parts) == 2:
        return int(parts[0]) * 60 + int(parts[1])
    if len(parts) == 3:
        return 99999  # godzinne odpadają
    return None

def score(c, query):
    s = secs(c["len"])
    if s is None or s < 20 or s > 240:
        return -1
    sc = 0.0
    if any(p in c["channel"].lower() for p in PREFERRED):
        sc += 6
    if s <= 95: sc += 4
    elif s <= 150: sc += 2
    elif s <= 200: sc += 1
    words = [w for w in query.lower().split() if w not in ("how", "to", "technique")]
    title = c["title"].lower()
    sc += sum(1 for w in words if w in title) * 0.5
    return sc

results = {}
for name, query in QUERIES.items():
    try:
        cands = parse_results(fetch(query))
    except Exception as e:
        print(f"{name}: ERROR {e}", file=sys.stderr)
        results[name] = None
        continue
    scored = sorted(((score(c, query), c) for c in cands), key=lambda x: -x[0])
    best = [c for s, c in scored[:3] if s > 0]
    results[name] = best
    top = best[0] if best else None
    print(f"{name:34} -> " + (f"[{top['len']:>5}] {top['channel'][:28]:30} {top['title'][:55]} ({top['id']})" if top else "BRAK"))
    time.sleep(0.7)

with open("tools/videos.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=1)
print("\nsaved tools/videos.json")
