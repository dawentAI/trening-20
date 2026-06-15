# Jednorazowo: znajduje kandydatów na filmy techniczne dla ćwiczeń mobilności.
import json, re, time, urllib.request, urllib.parse, sys

QUERIES = {
    "Rozciąganie zginaczy bioder w półklęku 2×30 s/str.": "half kneeling hip flexor stretch how to",
    "Rozciąganie klatki o słupek 2×30 s": "doorway pec chest stretch how to",
    "Dead bug 2×10": "dead bug exercise how to",
    "Rozciąganie dwugłowych 2×30 s/str.": "standing hamstring stretch how to",
    "Rotacje piersiowe „open book” 2×8/str.": "open book thoracic rotation stretch how to",
    "Plank 2×30 s": "plank exercise how to proper form",
    "Couch stretch 2×30 s/str.": "couch stretch how to",
    "Krążenia ramion z kijem/gumą 2×10": "shoulder pass through dislocate stick mobility how to",
    "Cat-cow ×8": "cat cow exercise how to",
}

PREFERRED = ["renaissance periodization", "jeff nippard", "scotthermanfitness",
             "scott herman", "squat university", "tom merrick", "the prehab guys",
             "puregym", "mind pump tv", "athlean-x", "physio"]

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
        return 99999
    return None

def score(c, query):
    s = secs(c["len"])
    if s is None or s < 20 or s > 300:
        return -1
    sc = 0.0
    if any(p in c["channel"].lower() for p in PREFERRED):
        sc += 6
    if s <= 95: sc += 4
    elif s <= 150: sc += 2
    elif s <= 240: sc += 1
    words = [w for w in query.lower().split() if w not in ("how", "to", "proper", "form")]
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
    print(f"\n=== {name}")
    for c in best:
        print(f"  [{c['len']:>5}] {c['channel'][:26]:28} {c['title'][:60]} ({c['id']})")
    time.sleep(0.7)

with open("tools/mobility_videos.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=1)
print("\nsaved tools/mobility_videos.json")
