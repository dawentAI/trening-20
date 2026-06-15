# Trening 20 minut — aplikacja

Prosta aplikacja webowa (czysty HTML/JS, bez zależności) do prowadzenia treningu wg planu
z pliku `Plan treningowy 20 minut.md`: kolejka sesji A→B→C, odhaczanie serii,
automatyczna progresja ciężarów, zapis historii do CSV.

## Jak to działa

- **Kolejka:** aplikacja pokazuje następną sesję na podstawie ostatniego wpisu w historii.
- **W trakcie sesji:** każde ćwiczenie ma proponowany ciężar i powtórzenia (wyliczone
  z historii wg zasad progresji), steppery do korekty, odhaczanie serii ✓, wybór zamiennika,
  RPE i notatkę. Stan sesji zapisuje się na bieżąco — zamknięcie przeglądarki nic nie traci.
- **Progresja (automatyczna):** pełny zakres powtórzeń w obu seriach przy RPE ≤9 → +2,5/+5 kg
  i powrót do dołu zakresu; seria poniżej zakresu 2 sesje z rzędu → −10%;
  3 sesje bez progresu → podpowiedź o zamienniku.
- **CSV:** po zakończeniu sesji aplikacja od razu proponuje udostępnienie/pobranie pliku
  `trening-historia.csv` (cała historia). Format:
  `data,sesja,cwiczenie,ciezar,powt1,powt2,powt3,rpe,uwagi`.
  Plik przenosisz do folderu projektu na PC. Przycisk **Import CSV** odtwarza historię
  (np. po zmianie przeglądarki/telefonu).
- Dane bieżące trzymane są w `localStorage` przeglądarki — CSV to kopia zapasowa i nośnik danych.

## Wymiana planu

Plan jest osobnym plikiem **`plan.js`** (obiekt `PLAN`). Żeby zmienić plan treningowy:
wygeneruj nowy `PLAN` na podstawie zaktualizowanego `Plan treningowy 20 minut.md` i podmień plik.
Historia CSV pozostaje kompatybilna, dopóki nazwy ćwiczeń się zgadzają.

W `plan.js` jest też obiekt `EXERCISE_INFO` (nazwa ćwiczenia → opis techniki + ID filmu YouTube).
Karta ćwiczenia pokazuje sekcję „ℹ️ Jak wykonać": opis, 4 klatki z filmu (miniatury YouTube —
`hqdefault`+`hq1..3`, więcej niż 4 YouTube nie udostępnia), osadzony odtwarzacz YouTube
(ładowany leniwie) i link do filmu. Skrypt `tools/find_videos.py` wyszukuje kandydatów na filmy dla nowych ćwiczeń.

## Uruchomienie / publikacja (GitHub Pages)

1. Repozytorium z zawartością tego folderu, gałąź `main`.
2. Settings → Pages → Source: `Deploy from a branch`, branch `main`, folder `/ (root)`.
3. Strona wstanie pod `https://<użytkownik>.github.io/<repo>/`.

Po każdej zmianie plików podbij `CACHE_VERSION` w `sw.js` (np. `trening-v2`),
inaczej telefony mogą trzymać starą wersję w cache.

### Na iPhonie

- Działa w każdej przeglądarce (Brave, Safari, Chrome — wszystkie używają WebKit).
- Żeby mieć ikonę na ekranie głównym i pełny tryb offline: otwórz adres w **Safari** →
  Udostępnij → **Dodaj do ekranu początkowego**. Uwaga: aplikacja z ekranu początkowego ma
  osobny `localStorage` niż karta Safari/Brave — trzymaj się jednego miejsca albo przenoś
  dane przez eksport/import CSV.

### Test lokalny na PC

```powershell
cd trening-app
python -m http.server 8000
# http://localhost:8000
```
