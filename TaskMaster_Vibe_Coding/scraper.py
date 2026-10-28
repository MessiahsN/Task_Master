import json
import time
from datetime import datetime
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup


HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0 Safari/537.36"
}


def scrape_hackernews(limit=30):
    url = "https://news.ycombinator.com/"
    response = requests.get(url, headers=HEADERS, timeout=10)
    response.raise_for_status()

    soup = BeautifulSoup(response.content, "html.parser")
    rows = soup.find_all("tr", class_="athing")

    articles = []
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for idx, row in enumerate(rows[:limit], start=1):
        titleline = row.find("span", class_="titleline")
        if not titleline:
            continue

        link_elem = titleline.find("a")
        if not link_elem:
            continue

        title = link_elem.get_text(strip=True)
        link = link_elem.get("href", "")
        link = urljoin(url, link)

        articles.append({
            "id": idx,
            "title": title,
            "source": "Hacker News",
            "link": link,
            "date_scraped": now,
            "category": "Technology",
        })

        time.sleep(0.5)

    return articles


def save_articles(articles, filename="articles.json"):
    with open(filename, "w", encoding="utf-8") as file:
        json.dump(articles, file, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    print("Scraping Hacker News...")
    articles = scrape_hackernews(limit=30)
    save_articles(articles)
    print(f"Saved {len(articles)} articles to articles.json")
