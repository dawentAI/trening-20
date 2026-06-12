// ============================================================
// PLAN TRENINGOWY — podmienialny plik wejściowy aplikacji.
// Źródło: "Plan treningowy 20 minut.md" (2026-06-12).
// Żeby zmienić plan: wygeneruj nowy obiekt PLAN z pliku .md
// i podmień ten plik. Historia w CSV pozostaje kompatybilna,
// dopóki nazwy ćwiczeń się zgadzają.
// ============================================================

const PLAN = {
  version: "2026-06-12",
  csvHeader: "data,sesja,cwiczenie,ciezar,powt1,powt2,powt3,rpe,uwagi",
  sessions: [
    {
      id: "A",
      title: "Klatka, plecy poziomo, nogi",
      station: "ławka + hantle, leg press",
      exercises: [
        { slot: "A1", name: "FLAT DB PRESS", sets: 2, repMin: 8, repMax: 10, rpe: "8–9", inc: 2.5,
          subs: ["MACHINE CHEST PRESS", "WEIGHTED DIP"],
          tip: "Pełny zakres, kontrolowane opuszczanie" },
        { slot: "A2", name: "INCLINE CHEST-SUPPORTED DB ROW", sets: 2, repMin: 8, repMax: 10, rpe: "8–9", inc: 2.5,
          subs: ["1-ARM DB ROW", "SEATED CABLE ROW"],
          tip: "Łokcie ~30°, ściągaj łopatki" },
        { slot: "B1", name: "LEG PRESS", sets: 2, repMin: 10, repMax: 12, rpe: "8–9", inc: 5,
          subs: ["HACK SQUAT", "GOBLET SQUAT"],
          tip: "Stopy na średniej szerokości, nie blokuj kolan" },
        { slot: "B2", name: "LEG PRESS TOE PRESS", sets: 2, repMin: 12, repMax: 15, rpe: "9–10", inc: 5,
          subs: ["SEATED CALF RAISE", "STANDING CALF RAISE"],
          tip: "Pełne rozciągnięcie na dole, bez odbicia" },
      ],
      mobility: [
        "Rozciąganie zginaczy bioder w półklęku 2×30 s/str.",
        "Rozciąganie klatki o słupek 2×30 s",
        "Dead bug 2×10",
      ],
    },
    {
      id: "B",
      title: "Zawias, barki, plecy pionowo",
      station: "ławka + hantle, wieża wyciągu",
      exercises: [
        { slot: "A1", name: "DB ROMANIAN DEADLIFT", sets: 2, repMin: 8, repMax: 10, rpe: "8–9", inc: 2.5,
          subs: ["ROMANIAN DEADLIFT", "45' HYPEREXTENSION"],
          tip: "Neutralne plecy, biodra w tył, czuj dwugłowe" },
        { slot: "A2", name: "SEATED DB SHOULDER PRESS", sets: 2, repMin: 8, repMax: 10, rpe: "8–9", inc: 2.5,
          subs: ["MACHINE SHOULDER PRESS", "STANDING DB ARNOLD PRESS"],
          tip: "Nie zatrzymuj się na dole" },
        { slot: "B1", name: "LAT PULLDOWN", sets: 2, repMin: 10, repMax: 12, rpe: "8–9", inc: 2.5,
          subs: ["NEUTRAL-GRIP PULLDOWN", "2-GRIP PULL-UP"],
          tip: "Łokcie w dół i do środka, bez bujania" },
        { slot: "B2", name: "ROPE FACEPULL", sets: 2, repMin: 12, repMax: 15, rpe: "9–10", inc: 2.5,
          subs: ["CABLE LATERAL RAISE", "REVERSE PEC DECK"],
          tip: "Ciągnij „na zewnątrz”; co kilka sesji wymieniaj z zamiennikiem 1" },
      ],
      mobility: [
        "Rozciąganie dwugłowych 2×30 s/str.",
        "Rotacje piersiowe „open book” 2×8/str.",
        "Plank 2×30 s",
      ],
    },
    {
      id: "C",
      title: "Uda izolacyjnie, ramiona",
      station: "sąsiednie maszyny nóg, gryf EZ",
      exercises: [
        { slot: "A1", name: "LEG EXTENSION", sets: 2, repMin: 12, repMax: 15, rpe: "9–10", inc: 5,
          subs: ["DB STEP UP", "GOBLET SQUAT"],
          tip: "Sekunda zatrzymania na górze" },
        { slot: "A2", name: "SEATED LEG CURL", sets: 2, repMin: 10, repMax: 12, rpe: "9–10", inc: 5,
          subs: ["LYING LEG CURL", "NORDIC HAM CURL"],
          tip: "Biodra dociśnięte, pełny zakres" },
        { slot: "B1", name: "EZ BAR CURL", sets: 2, repMin: 10, repMax: 12, rpe: "9–10", inc: 2.5,
          subs: ["DB CURL", "CABLE EZ CURL"],
          tip: "Łuk „na zewnątrz”, nie „do góry”" },
        { slot: "B2", name: "EZ BAR SKULL CRUSHER", sets: 2, repMin: 12, repMax: 15, rpe: "9–10", inc: 2.5,
          subs: ["OVERHEAD CABLE TRICEPS EXTENSION", "DB FRENCH PRESS"],
          tip: "Gryf za głowę, stałe napięcie tricepsa" },
      ],
      mobility: [
        "Couch stretch 2×30 s/str.",
        "Krążenia ramion z kijem/gumą 2×10",
        "Cat-cow ×8",
      ],
    },
  ],
};
